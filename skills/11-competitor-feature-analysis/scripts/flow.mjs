#!/usr/bin/env node
/**
 * Replay cached flow definitions — run actions per screen and capture PNGs.
 */
import path from 'node:path';
import {
  findRepoRoot,
  profilesDir,
  ensureDir,
  parseArgs,
  cmd,
} from './lib/paths.mjs';
import { launchPersistentContext } from './lib/cloak.mjs';
import { ensureCloakBrowser, clearProfileLock } from './lib/setup.mjs';
import { withProfileLock } from './lib/profile-lock.mjs';
import { settlePage } from './lib/settle.mjs';
import { runActions } from './lib/actions.mjs';
import { loadFlowFile, validateFlow } from './lib/flow-io.mjs';
import { isLoginPage } from './lib/snapshot.mjs';

function printHelp() {
  console.log(`Usage: competitor-flow [options]

Options:
  --competitor <slug>   Competitor slug (required if not in flow file)
  --flow <path>         Path to flow cache JSON (required)
  --run-dir <path>      Output run folder for screenshots (required)
  --help
`);
}

async function replayFlow({ repoRoot, flowPath, runDir, competitorOverride }) {
  const flow = validateFlow(loadFlowFile(flowPath));
  const competitor = competitorOverride || flow.competitor;
  if (competitor !== flow.competitor && !competitorOverride) {
    throw new Error(`Flow competitor "${flow.competitor}" does not match --competitor "${competitorOverride}"`);
  }

  const screenshotsDir = path.join(runDir, 'screenshots');
  ensureDir(screenshotsDir);

  const profilePath = profilesDir(repoRoot, competitor);
  ensureDir(profilePath);
  clearProfileLock(profilePath);
  await ensureCloakBrowser();

  const captures = [];

  return withProfileLock(profilePath, async () => {
    let context;
    try {
      context = await launchPersistentContext({
        userDataDir: profilePath,
        headless: true,
        viewport: { width: 1440, height: 900 },
        humanize: false,
      });
      const page = context.pages()[0] || (await context.newPage());

      for (let i = 0; i < flow.screens.length; i++) {
        const screen = flow.screens[i];
        const screenActions = screen.actions || [];

        if (screenActions.length === 0 && screen.url) {
          await page.goto(screen.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        } else {
          await page.goto(flow.startUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
          await settlePage(page);

          let cumulative = [];
          for (let j = 0; j <= i; j++) {
            cumulative = cumulative.concat(flow.screens[j].actions || []);
          }
          if (cumulative.length) {
            try {
              await runActions(page, cumulative);
            } catch (e) {
              console.error(
                JSON.stringify({
                  status: 'action_failed',
                  state: screen.state,
                  message: e.message,
                  competitor,
                })
              );
              process.exit(1);
            }
          }
        }

        await settlePage(page);

        if (await isLoginPage(page)) {
          console.error(
            JSON.stringify({
              status: 'auth_required',
              message: `Session missing for ${competitor}. Run: ${cmd('competitor-login', `--competitor ${competitor}`)}`,
              competitor,
              state: screen.state,
            })
          );
          process.exit(2);
        }

        if (screen.successSignals?.length) {
          const text = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
          const ok = screen.successSignals.some((s) => text.includes(String(s).toLowerCase()));
          if (!ok) {
            console.error(
              JSON.stringify({
                status: 'state_mismatch',
                state: screen.state,
                message: `successSignals not found: ${screen.successSignals.join(', ')}`,
                url: page.url(),
              })
            );
            process.exit(1);
          }
        }

        const screenshotPath = path.join(screenshotsDir, `${competitor}-${screen.state}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        captures.push({
          state: screen.state,
          label: screen.label,
          url: page.url(),
          screenshotPath: path.relative(repoRoot, screenshotPath),
          flowPath: path.relative(repoRoot, flowPath),
          optional: screen.optional || false,
        });
      }

      console.log(JSON.stringify({ status: 'ok', competitor, captures }, null, 2));
      return captures;
    } finally {
      if (context) await context.close();
    }
  });
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const flowPath = args.flow;
  const runDirArg = args['run-dir'];
  if (!flowPath || !runDirArg) {
    printHelp();
    process.exit(1);
  }

  const repoRoot = findRepoRoot();
  const flowAbs = path.isAbsolute(flowPath) ? flowPath : path.join(repoRoot, flowPath);
  const runDir = path.isAbsolute(runDirArg) ? runDirArg : path.join(repoRoot, runDirArg);
  ensureDir(runDir);

  await replayFlow({
    repoRoot,
    flowPath: flowAbs,
    runDir,
    competitorOverride: args.competitor,
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
