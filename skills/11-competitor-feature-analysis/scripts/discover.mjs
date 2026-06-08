#!/usr/bin/env node
/**
 * Agent-driven discovery CLI — snapshot, click, capture screens, save flow cache.
 * Uses long-lived daemon (default) or stateless replay per command (--no-daemon).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  findRepoRoot,
  competitorsPath,
  parseArgs,
  slugify,
  flowCachePath,
  defaultRunDir,
  todayISO,
  cmd,
} from './lib/paths.mjs';
import { loadCompetitors, getCachedFeatureUrl, validateCompetitorsConfig, upsertFeatureScreen } from './lib/competitors.mjs';
import { inferCapabilityPattern, loadCapabilityPattern } from './lib/patterns.mjs';
import { saveFlow, validateFlow } from './lib/flow-io.mjs';
import {
  loadSession,
  saveSession,
  deleteSession,
  createSession,
  appendNavigation,
  addCapturedScreen,
} from './lib/session-io.mjs';
import { withDiscoverPage } from './lib/discover-browser.mjs';
import { captureSnapshot, snapshotExcerpt, isLoginPage } from './lib/snapshot.mjs';
import { locatorFromArgs } from './lib/actions.mjs';
import {
  startDaemon,
  stopDaemon,
  isDaemonRunning,
  daemonRequest,
} from './lib/discover-daemon.mjs';

function printHelp() {
  console.log(`Usage: competitor-discover --cmd <command> [options]

Commands:
  launch          Start discovery session + daemon browser (default)
  snapshot        Accessibility-style element list with @eN refs
  click           Click element (--ref or --role + --name)
  hover           Hover element (reveals edit menus / pencils)
  fill            Fill field (--ref or locator flags + --value)
  press           Press key (--key Enter)
  goto            Navigate (--url)
  capture-screen  Record screen in draft flow (--state, --label, optional --url)
  save-flow       Write Knowledge/competitor-flows/{feature}/{competitor}.json
  close           Stop daemon and delete session file

Session:
  --session-id <id>     Required after launch (default id: {competitor}-{featureSlug})

Common flags:
  --competitor <slug>
  --feature <name>
  --pattern <capability-pattern-id>
  --url <start-url>     Override cached start URL
  --run-dir <path>      Screenshots during discovery
  --no-daemon           Stateless mode (slow; replays full history per command)
  --scroll              Full-page scroll before snapshot
  --optional            Mark captured screen as optional branch
  --condition <text>    Branch condition label (plan-gated, empty-state, etc.)
  --navigation-strategy click|goto|hover-click
  --help
`);
}

function output(obj, exitCode = 0) {
  console.log(JSON.stringify(obj, null, 2));
  process.exit(exitCode);
}

function fail(code, message, extra = {}) {
  console.error(JSON.stringify({ status: 'error', code, message, ...extra }, null, 2));
  process.exit(code === 'auth_required' ? 2 : code === 'profile_busy' ? 4 : 1);
}

function useDaemon(args) {
  return !args['no-daemon'];
}

async function runViaDaemon(repoRoot, sessionId, body) {
  try {
    return await daemonRequest(repoRoot, sessionId, body);
  } catch (e) {
    if (e.code === 'auth_required') fail('auth_required', e.message);
    if (e.code === 'profile_busy') fail('profile_busy', e.message);
    throw e;
  }
}

function buildPendingAction(session, loc, type) {
  if (type === 'click') {
    if (loc.ref && session.elementRefs[loc.ref]) {
      return { click: { ...session.elementRefs[loc.ref] } };
    }
    return { click: loc };
  }
  if (type === 'hover') {
    if (loc.ref && session.elementRefs[loc.ref]) {
      return { hover: { ...session.elementRefs[loc.ref] } };
    }
    return { hover: loc };
  }
  return null;
}

async function cmdLaunch(repoRoot, args) {
  const competitor = args.competitor;
  const feature = args.feature;
  if (!competitor || !feature) {
    printHelp();
    process.exit(1);
  }

  const config = loadCompetitors(competitorsPath(repoRoot));
  validateCompetitorsConfig(config);
  const entry = config.competitors[competitor];
  if (!entry) throw new Error(`Unknown competitor "${competitor}"`);

  const featureSlug = slugify(feature);
  const sessionId = args['session-id'] || `${competitor}-${featureSlug}`;
  const pattern = args.pattern
    ? loadCapabilityPattern(args.pattern)
    : inferCapabilityPattern(feature);
  const startUrl =
    args.url ||
    getCachedFeatureUrl(config.featureScreens, competitor, feature) ||
    entry.loginUrl;

  const session = createSession({
    sessionId,
    competitor,
    feature,
    featureSlug,
    capabilityPattern: pattern.id || args.pattern || 'create-resource',
    scope: args.scope,
    startUrl,
  });

  let result;
  if (useDaemon(args)) {
    saveSession(repoRoot, session);
    await startDaemon(repoRoot, sessionId);
    result = await runViaDaemon(repoRoot, sessionId, { cmd: 'ping' });
    const snap = await runViaDaemon(repoRoot, sessionId, { cmd: 'snapshot', scroll: Boolean(args.scroll) });
    session.elementRefs = {};
    const loaded = loadSession(repoRoot, sessionId);
    Object.assign(session, loaded);
    result = {
      url: snap.url || result.url,
      title: '',
      loggedIn: true,
      capabilityPattern: session.capabilityPattern,
      expectedStates: pattern.expectedStates,
      snapshotExcerpt: snap.excerpt,
      daemon: true,
    };
  } else {
    try {
      result = await withDiscoverPage(repoRoot, session, async (page) => {
        const loggedIn = !(await isLoginPage(page));
        const snap = await captureSnapshot(page, { scroll: Boolean(args.scroll) });
        session.elementRefs = snap.elementRefs;
        return {
          url: page.url(),
          title: await page.title(),
          loggedIn,
          capabilityPattern: session.capabilityPattern,
          expectedStates: pattern.expectedStates,
          snapshotExcerpt: snapshotExcerpt(snap.elements),
          daemon: false,
        };
      });
    } catch (e) {
      if (e.code === 'auth_required') {
        fail('auth_required', e.message, { competitor, login: cmd('competitor-login', `--competitor ${competitor}`) });
      }
      if (e.code === 'profile_busy') fail('profile_busy', e.message);
      throw e;
    }
    saveSession(repoRoot, session);
  }

  output({ status: 'ok', cmd: 'launch', sessionId, ...result });
}

async function cmdSnapshot(repoRoot, args) {
  const sessionId = args['session-id'];
  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    const snap = await runViaDaemon(repoRoot, sessionId, { cmd: 'snapshot', scroll: Boolean(args.scroll) });
    output({ status: 'ok', cmd: 'snapshot', sessionId, ...snap });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      const snap = await captureSnapshot(page, { scroll: Boolean(args.scroll) });
      session.elementRefs = snap.elementRefs;
      saveSession(repoRoot, session);
      output({
        status: 'ok',
        cmd: 'snapshot',
        sessionId: session.sessionId,
        url: page.url(),
        elements: snap.elements,
        excerpt: snapshotExcerpt(snap.elements),
      });
    });
  } catch (e) {
    if (e.code === 'auth_required') fail('auth_required', e.message, { competitor: session.competitor });
    if (e.code === 'profile_busy') fail('profile_busy', e.message);
    throw e;
  }
}

async function cmdClick(repoRoot, args) {
  const sessionId = args['session-id'];
  const loc = locatorFromArgs(args);
  if (!loc) fail('invalid_locator', 'Provide --ref or --role/--name/--text');
  if (loc.ref) {
    const session = loadSession(repoRoot, sessionId);
    if (!session.elementRefs[loc.ref]) fail('unknown_ref', `Unknown ref "${loc.ref}". Run snapshot first.`);
  }

  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    const result = await runViaDaemon(repoRoot, sessionId, { cmd: 'click', locator: loc });
    output({ status: 'ok', cmd: 'click', ...result });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  const pendingAction = buildPendingAction(session, loc, 'click');
  appendNavigation(session, pendingAction);

  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      const snap = await captureSnapshot(page);
      session.elementRefs = snap.elementRefs;
      saveSession(repoRoot, session);
      output({
        status: 'ok',
        cmd: 'click',
        url: page.url(),
        excerpt: snapshotExcerpt(snap.elements),
      });
    }, { pendingAction });
  } catch (e) {
    session.navigationLog.pop();
    saveSession(repoRoot, session);
    if (e.code === 'auth_required') fail('auth_required', e.message);
    if (e.code === 'profile_busy') fail('profile_busy', e.message);
    fail('action_failed', e.message);
  }
}

async function cmdHover(repoRoot, args) {
  const sessionId = args['session-id'];
  const loc = locatorFromArgs(args);
  if (!loc) fail('invalid_locator', 'Provide --ref or --role/--name/--text');

  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    const result = await runViaDaemon(repoRoot, sessionId, { cmd: 'hover', locator: loc });
    output({ status: 'ok', cmd: 'hover', ...result });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  const pendingAction = buildPendingAction(session, loc, 'hover');
  appendNavigation(session, pendingAction);

  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      const snap = await captureSnapshot(page);
      session.elementRefs = snap.elementRefs;
      saveSession(repoRoot, session);
      output({
        status: 'ok',
        cmd: 'hover',
        url: page.url(),
        excerpt: snapshotExcerpt(snap.elements),
      });
    }, { pendingAction });
  } catch (e) {
    session.navigationLog.pop();
    saveSession(repoRoot, session);
    fail('action_failed', e.message);
  }
}

async function cmdFill(repoRoot, args) {
  const sessionId = args['session-id'];
  const loc = locatorFromArgs(args);
  const value = args.value;
  if (!loc || value === undefined) fail('invalid_args', 'fill requires locator flags and --value');

  const sessionForFill = loadSession(repoRoot, sessionId);
  const fillSpec = loc.ref
    ? { ...sessionElementSpec(sessionForFill, loc), value }
    : { ...loc, value };
  const pendingAction = { fill: fillSpec };

  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    const result = await runViaDaemon(repoRoot, sessionId, { cmd: 'fill', loc, value, fillSpec });
    output({ status: 'ok', cmd: 'fill', ...result });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  appendNavigation(session, pendingAction);

  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      saveSession(repoRoot, session);
      output({ status: 'ok', cmd: 'fill', url: page.url() });
    }, { pendingAction });
  } catch (e) {
    session.navigationLog.pop();
    saveSession(repoRoot, session);
    fail('action_failed', e.message);
  }
}

function sessionElementSpec(session, loc) {
  if (loc.ref && session.elementRefs[loc.ref]) {
    const { role, name, text } = session.elementRefs[loc.ref];
    return { role, name, text };
  }
  return {};
}

async function cmdPress(repoRoot, args) {
  const sessionId = args['session-id'];
  const key = args.key || 'Enter';
  const pendingAction = { press: { key } };

  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    const result = await runViaDaemon(repoRoot, sessionId, { cmd: 'press', key });
    output({ status: 'ok', cmd: 'press', ...result });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  appendNavigation(session, pendingAction);

  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      saveSession(repoRoot, session);
      output({ status: 'ok', cmd: 'press', url: page.url() });
    }, { pendingAction });
  } catch (e) {
    session.navigationLog.pop();
    saveSession(repoRoot, session);
    fail('action_failed', e.message);
  }
}

async function cmdGoto(repoRoot, args) {
  const sessionId = args['session-id'];
  const url = args.url;
  if (!url) fail('invalid_args', 'goto requires --url');
  const pendingAction = { goto: { url } };

  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    const session = loadSession(repoRoot, sessionId);
    appendNavigation(session, pendingAction);
    saveSession(repoRoot, session);
    const result = await runViaDaemon(repoRoot, sessionId, { cmd: 'goto', url });
    output({ status: 'ok', cmd: 'goto', ...result });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  appendNavigation(session, pendingAction);

  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      saveSession(repoRoot, session);
      output({ status: 'ok', cmd: 'goto', url: page.url() });
    }, { pendingAction });
  } catch (e) {
    session.navigationLog.pop();
    saveSession(repoRoot, session);
    fail('action_failed', e.message);
  }
}

async function cmdCaptureScreen(repoRoot, args) {
  const sessionId = args['session-id'];
  const state = args.state || 'main';
  const label = args.label || state;
  const runDir = args['run-dir'];
  const gotoPending = args.url ? { goto: { url: args.url } } : null;

  const captureBody = {
    cmd: 'capture-screen',
    state,
    label,
    runDir,
    optional: Boolean(args.optional),
    condition: args.condition,
    navigationStrategy: args['navigation-strategy'],
  };

  if (useDaemon(args) && isDaemonRunning(repoRoot, sessionId)) {
    if (gotoPending) {
      const session = loadSession(repoRoot, sessionId);
      appendNavigation(session, gotoPending);
      saveSession(repoRoot, session);
      await runViaDaemon(repoRoot, sessionId, { cmd: 'goto', url: args.url });
    }
    const result = await runViaDaemon(repoRoot, sessionId, captureBody);
    output({ status: 'ok', cmd: 'capture-screen', ...result });
    return;
  }

  const session = loadSession(repoRoot, sessionId);
  if (gotoPending) {
    appendNavigation(session, gotoPending);
    saveSession(repoRoot, session);
  }

  try {
    await withDiscoverPage(repoRoot, session, async (page) => {
      let screenshotPath = null;
      if (runDir) {
        const dir = path.isAbsolute(runDir) ? runDir : path.join(repoRoot, runDir);
        const shots = path.join(dir, 'screenshots');
        fs.mkdirSync(shots, { recursive: true });
        const file = path.join(shots, `${session.competitor}-${state}.png`);
        await page.screenshot({ path: file, fullPage: false });
        screenshotPath = path.relative(repoRoot, file);
      }

      addCapturedScreen(session, {
        state,
        label,
        url: page.url(),
        optional: Boolean(args.optional),
        condition: args.condition,
        navigationStrategy: args['navigation-strategy'],
      });
      saveSession(repoRoot, session);

      output({
        status: 'ok',
        cmd: 'capture-screen',
        state,
        url: page.url(),
        screenshotPath,
        screensCaptured: session.draftFlow.screens.length,
      });
    }, gotoPending ? { pendingAction: gotoPending } : {});
  } catch (e) {
    if (e.code === 'auth_required') fail('auth_required', e.message);
    throw e;
  }
}

async function cmdSaveFlow(repoRoot, args) {
  const session = loadSession(repoRoot, args['session-id']);
  const flow = { ...session.draftFlow, lastVerified: todayISO() };
  if (args.notes) flow.notes = args.notes;

  try {
    validateFlow(flow);
  } catch (e) {
    fail('invalid_flow', e.message);
  }

  const saved = saveFlow(repoRoot, flow);

  const competitorsFile = competitorsPath(repoRoot);
  const updated = upsertFeatureScreen(competitorsFile, {
    competitorSlug: flow.competitor,
    feature: flow.feature,
    cachedUrl: flow.startUrl,
    lastVerified: flow.lastVerified,
  });
  fs.writeFileSync(competitorsFile, updated);

  if (args['run-dir']) {
    const dir = path.isAbsolute(args['run-dir']) ? args['run-dir'] : path.join(repoRoot, args['run-dir']);
    const shots = path.join(dir, 'screenshots');
    for (const screen of flow.screens) {
      const probe = path.join(shots, `${flow.competitor}-${screen.state}-probe.png`);
      const canonical = path.join(shots, `${flow.competitor}-${screen.state}.png`);
      if (fs.existsSync(probe) && !fs.existsSync(canonical)) {
        fs.copyFileSync(probe, canonical);
      }
    }
  }

  output({
    status: 'ok',
    cmd: 'save-flow',
    flowPath: path.relative(repoRoot, saved.jsonPath),
    flowMdPath: path.relative(repoRoot, saved.mdPath),
    screens: flow.screens.length,
  });
}

async function cmdClose(repoRoot, args) {
  const sessionId = args['session-id'];
  await stopDaemon(repoRoot, sessionId);
  deleteSession(repoRoot, sessionId);
  output({ status: 'ok', cmd: 'close', sessionId });
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help || !args.cmd) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const repoRoot = findRepoRoot();
  const cmd = args.cmd;

  if (!args['session-id'] && cmd !== 'launch') {
    fail('missing_session', 'Provide --session-id from launch output');
  }

  switch (cmd) {
    case 'launch':
      await cmdLaunch(repoRoot, args);
      break;
    case 'snapshot':
      await cmdSnapshot(repoRoot, args);
      break;
    case 'click':
      await cmdClick(repoRoot, args);
      break;
    case 'hover':
      await cmdHover(repoRoot, args);
      break;
    case 'fill':
      await cmdFill(repoRoot, args);
      break;
    case 'press':
      await cmdPress(repoRoot, args);
      break;
    case 'goto':
      await cmdGoto(repoRoot, args);
      break;
    case 'capture-screen':
      await cmdCaptureScreen(repoRoot, args);
      break;
    case 'save-flow':
      await cmdSaveFlow(repoRoot, args);
      break;
    case 'close':
      await cmdClose(repoRoot, args);
      break;
    default:
      fail('unknown_cmd', `Unknown command "${cmd}"`);
  }
}

main().catch((err) => {
  fail('error', err.message || String(err));
});
