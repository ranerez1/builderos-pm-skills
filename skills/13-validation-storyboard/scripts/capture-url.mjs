#!/usr/bin/env node
// Interactive CloakBrowser walk: user navigates the flow in a real browser,
// presses Enter to capture each step's screenshot. Skill prompts for label,
// expected behavior, and assertions per step. Writes flow.json incrementally
// so a crash leaves you with what you captured.
//
// Usage:
//   node scripts/capture-url.mjs --url=https://app.example.com --feature=billing-export [--env=staging] [--goal="..."] [--headless]

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { launchPersistentContext } from './lib/browser.mjs';
import { withProfileLock } from './lib/profile-lock.mjs';
import {
  emptyFlow,
  makeStep,
  appendStep,
  writeFlow,
  readFlow,
  defaultOutputDir,
  ensureOutputDir,
  findRepoRoot,
  slugify,
} from './lib/flow-io.mjs';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [k, ...rest] = raw.slice(2).split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

async function prompt(rl, q, def = '') {
  const suffix = def ? ` [${def}]` : '';
  const answer = (await rl.question(`${q}${suffix}: `)).trim();
  return answer || def;
}

async function promptMulti(rl, q) {
  console.log(`${q} (one per line, blank line to finish):`);
  const out = [];
  while (true) {
    const line = (await rl.question('  - ')).trim();
    if (!line) break;
    out.push(line);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error('Missing --url=<https://...>');
    process.exit(2);
  }
  if (!args.feature) {
    console.error('Missing --feature=<slug> (used as output folder name)');
    process.exit(2);
  }

  const repoRoot = findRepoRoot();
  const outDir = ensureOutputDir(defaultOutputDir(repoRoot, args.feature));
  const flowPath = path.join(outDir, 'flow.json');
  const screenshotsDir = path.join(outDir, 'screenshots');

  // Resume if a flow.json already exists for today; otherwise start fresh.
  let flow = readFlow(flowPath);
  if (!flow) {
    flow = emptyFlow({
      feature: args.feature,
      url: args.url,
      env: args.env || 'staging',
      goal: args.goal || '',
      preconditions: [],
      capturedVia: 'url',
    });
  } else {
    console.log(`Resuming existing flow (${flow.steps.length} steps already captured)`);
  }

  const profilePath = path.join(os.homedir(), '.cache', 'builderos-validation-storyboard', slugify(args.feature));
  fs.mkdirSync(profilePath, { recursive: true });

  const rl = readline.createInterface({ input, output });

  // Initial interview (only if this is a fresh flow)
  if (flow.steps.length === 0) {
    if (!flow.goal) flow.goal = await prompt(rl, 'What does "passes" mean in one sentence?');
    flow.preconditions = await promptMulti(rl, 'Preconditions (logged in as X, etc.)');
    writeFlow(flowPath, flow);
  }

  await withProfileLock(
    profilePath,
    async () => {
      const context = await launchPersistentContext({
        userDataDir: profilePath,
        headless: !!args.headless,
        viewport: { width: 1440, height: 900 },
      });
      const page = context.pages()[0] || (await context.newPage());

      try {
        await page.goto(flow.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
        console.log(`\nBrowser launched at ${flow.url}.`);
        console.log('Navigate to each step in the browser, then describe it here.');
        console.log('Type "done" as the label to finish, or Ctrl-C to abort (flow.json is saved after each step).\n');

        let index = flow.steps.length + 1;
        while (true) {
          const label = await prompt(rl, `Step ${index} label`);
          if (!label || label.toLowerCase() === 'done') break;

          const action = await prompt(rl, '  Action taken (one line)');
          const expected = await prompt(rl, '  Expected behavior (one line)');
          const assertions = await promptMulti(rl, '  Assertions (testable conditions)');

          const padded = String(index).padStart(2, '0');
          const slug = slugify(label) || `step-${padded}`;
          const screenshotRel = path.join('screenshots', `${padded}-${slug}.png`);
          const screenshotAbs = path.join(outDir, screenshotRel);

          await page.screenshot({ path: screenshotAbs, fullPage: false });

          const step = makeStep({
            index,
            label,
            action,
            expected,
            screenshot: screenshotRel,
            assertions,
          });
          appendStep(flow, step);
          writeFlow(flowPath, flow);
          console.log(`  ✓ Captured ${screenshotRel}\n`);
          index += 1;
        }
      } finally {
        await context.close();
      }
    },
    { sessionId: `capture-url-${process.pid}` },
  );

  rl.close();
  console.log(`\nDone. ${flow.steps.length} step(s) captured.`);
  console.log(`flow.json: ${flowPath}`);
  console.log(`screenshots: ${screenshotsDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
