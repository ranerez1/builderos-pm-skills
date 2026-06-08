#!/usr/bin/env node
/**
 * Long-lived discover browser — keeps CloakBrowser open between discover CLI commands.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/paths.mjs';
import { loadSession, saveSession } from './lib/session-io.mjs';
import { launchPersistentContext } from './lib/cloak.mjs';
import { replayToState } from './lib/discover-browser.mjs';
import { captureSnapshot, snapshotExcerpt, isLoginPage } from './lib/snapshot.mjs';
import { settlePage } from './lib/settle.mjs';
import { runAction } from './lib/actions.mjs';
import { addCapturedScreen } from './lib/session-io.mjs';
import { acquireProfileLock, releaseProfileLock } from './lib/profile-lock.mjs';
import { clearProfileLock, ensureCloakBrowser } from './lib/setup.mjs';
import { profilesDir, ensureDir } from './lib/paths.mjs';
import { daemonMetaPath } from './lib/discover-daemon.mjs';

let context = null;
let page = null;
let repoRoot = null;
let session = null;
let appliedNavCount = 0;

async function ensurePage() {
  session = loadSession(repoRoot, session.sessionId);
  if (page && context) return page;

  const profilePath = profilesDir(repoRoot, session.competitor);
  ensureDir(profilePath);
  clearProfileLock(profilePath);
  await ensureCloakBrowser();
  await acquireProfileLock(profilePath, { sessionId: session.sessionId });

  context = await launchPersistentContext({
    userDataDir: profilePath,
    headless: true,
    viewport: { width: 1440, height: 900 },
    humanize: false,
  });
  page = context.pages()[0] || (await context.newPage());
  await page.goto(session.startUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await settlePage(page);
  await replayToState(page, session);
  appliedNavCount = session.navigationLog.length;
  if (await isLoginPage(page)) {
    const err = new Error(`auth_required for ${session.competitor}`);
    err.code = 'auth_required';
    throw err;
  }
  return page;
}

/** Apply only navigation actions added since last daemon command. */
async function applyPendingNavigation() {
  session = loadSession(repoRoot, session.sessionId);
  await ensurePage();
  const pending = session.navigationLog.slice(appliedNavCount);
  for (const action of pending) {
    await runAction(page, action);
    await settlePage(page);
  }
  appliedNavCount = session.navigationLog.length;
}

async function handleCmd(body) {
  const cmd = body.cmd;
  session = loadSession(repoRoot, session.sessionId);

  if (cmd === 'shutdown') {
    if (context) await context.close();
    releaseProfileLock(profilesDir(repoRoot, session.competitor));
    context = null;
    page = null;
    return { status: 'ok', cmd: 'shutdown' };
  }

  if (cmd === 'ping') {
    await ensurePage();
    return { status: 'ok', cmd: 'ping', url: page.url() };
  }

  if (cmd === 'snapshot') {
    await ensurePage();
    const scroll = Boolean(body.scroll);
    const snap = await captureSnapshot(page, { scroll });
    session.elementRefs = snap.elementRefs;
    saveSession(repoRoot, session);
    return {
      status: 'ok',
      cmd: 'snapshot',
      url: page.url(),
      elements: snap.elements,
      excerpt: snapshotExcerpt(snap.elements),
    };
  }

  if (cmd === 'click') {
    const loc = body.locator;
    let pendingAction;
    if (loc.ref && session.elementRefs[loc.ref]) {
      pendingAction = { click: { ...session.elementRefs[loc.ref] } };
    } else {
      pendingAction = { click: loc };
    }
    session.navigationLog.push(pendingAction);
    saveSession(repoRoot, session);
    await applyPendingNavigation();
    const snap = await captureSnapshot(page);
    session.elementRefs = snap.elementRefs;
    saveSession(repoRoot, session);
    return { status: 'ok', cmd: 'click', url: page.url(), excerpt: snapshotExcerpt(snap.elements) };
  }

  if (cmd === 'hover') {
    const loc = body.locator;
    const hoverSpec = loc.ref && session.elementRefs[loc.ref] ? { ...session.elementRefs[loc.ref] } : loc;
    const pendingAction = { hover: hoverSpec };
    session.navigationLog.push(pendingAction);
    saveSession(repoRoot, session);
    await applyPendingNavigation();
    const snap = await captureSnapshot(page);
    session.elementRefs = snap.elementRefs;
    saveSession(repoRoot, session);
    return { status: 'ok', cmd: 'hover', url: page.url(), excerpt: snapshotExcerpt(snap.elements) };
  }

  if (cmd === 'goto') {
    const pendingAction = { goto: { url: body.url } };
    session.navigationLog.push(pendingAction);
    saveSession(repoRoot, session);
    await applyPendingNavigation();
    return { status: 'ok', cmd: 'goto', url: page.url() };
  }

  if (cmd === 'fill') {
    const pendingAction = { fill: body.fillSpec };
    session.navigationLog.push(pendingAction);
    saveSession(repoRoot, session);
    await applyPendingNavigation();
    saveSession(repoRoot, session);
    return { status: 'ok', cmd: 'fill', url: page.url() };
  }

  if (cmd === 'press') {
    const pendingAction = { press: { key: body.key } };
    session.navigationLog.push(pendingAction);
    saveSession(repoRoot, session);
    await applyPendingNavigation();
    saveSession(repoRoot, session);
    return { status: 'ok', cmd: 'press', url: page.url() };
  }

  if (cmd === 'capture-screen') {
    await ensurePage();
    let screenshotPath = null;
    if (body.runDir) {
      const dir = path.isAbsolute(body.runDir) ? body.runDir : path.join(repoRoot, body.runDir);
      const shots = path.join(dir, 'screenshots');
      fs.mkdirSync(shots, { recursive: true });
      const file = path.join(shots, `${session.competitor}-${body.state}.png`);
      await page.screenshot({ path: file, fullPage: false });
      screenshotPath = path.relative(repoRoot, file);
    }
    addCapturedScreen(session, {
      state: body.state,
      label: body.label,
      url: page.url(),
      optional: body.optional,
      condition: body.condition,
      navigationStrategy: body.navigationStrategy,
    });
    saveSession(repoRoot, session);
    return {
      status: 'ok',
      cmd: 'capture-screen',
      state: body.state,
      url: page.url(),
      screenshotPath,
      screensCaptured: session.draftFlow.screens.length,
    };
  }

  throw new Error(`Unknown daemon cmd: ${cmd}`);
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  repoRoot = args['repo-root'];
  const sessionId = args['session-id'];
  if (!repoRoot || !sessionId) {
    console.error('discover-server requires --repo-root and --session-id');
    process.exit(1);
  }

  session = loadSession(repoRoot, sessionId);

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/cmd') {
      res.writeHead(404);
      res.end();
      return;
    }
    let body = '';
    req.on('data', (c) => {
      body += c;
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const result = await handleCmd(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        if (parsed.cmd === 'shutdown') {
          server.close();
          process.exit(0);
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', code: e.code || 'error', message: e.message }));
      }
    });
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  const meta = { pid: process.pid, port, sessionId, since: Date.now() };
  fs.writeFileSync(daemonMetaPath(repoRoot, sessionId), `${JSON.stringify(meta, null, 2)}\n`);

  process.on('SIGTERM', async () => {
    if (context) await context.close();
    releaseProfileLock(profilesDir(repoRoot, session.competitor));
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
