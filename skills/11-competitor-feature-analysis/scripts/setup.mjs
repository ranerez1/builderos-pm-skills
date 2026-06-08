#!/usr/bin/env node
/**
 * One-time CloakBrowser setup: npm deps check, binary download, platform verify.
 */
import path from 'node:path';
import { findRepoRoot, competitorsPath, profilesDir, parseArgs, cmd, skillDirRel } from './lib/paths.mjs';
import {
  loadCompetitors,
  scaffoldCompetitorsIfMissing,
  validateCompetitorsConfig,
} from './lib/competitors.mjs';
import {
  ensureCloakBrowser,
  MIN_CLOAKBROWSER_VERSION,
  profileHasData,
} from './lib/setup.mjs';

function printHelp() {
  console.log(`Usage: competitor-setup [options]

Options:
  --check-only   Verify install without downloading binary
  --help         Show this help

Run once after cloning or when capture fails with binary/platform errors.
Also run: cd ${skillDirRel()} && npm install
`);
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const checkOnly = Boolean(args['check-only']);
  const info = await ensureCloakBrowser({ download: !checkOnly });

  const repoRoot = findRepoRoot();
  const scaffolded = scaffoldCompetitorsIfMissing(repoRoot);
  if (scaffolded) {
    console.error(`Created ${scaffolded} — replace every [FILL] before capture.`);
  }

  let sessions = [];
  try {
    const config = loadCompetitors(competitorsPath(repoRoot));
    validateCompetitorsConfig(config);
    sessions = Object.keys(config.competitors).map((slug) => ({
      slug,
      profilePath: path.relative(repoRoot, profilesDir(repoRoot, slug)),
      hasProfileData: profileHasData(profilesDir(repoRoot, slug)),
    }));
  } catch {
    sessions = [];
  }

  const needsLogin = sessions.filter((s) => !s.hasProfileData).map((s) => s.slug);

  let nextSteps;
  if (sessions.length === 0) {
    nextSteps = [
      'Fill Knowledge/competitors.md, then re-run competitor-setup.',
      cmd('competitor-login', '--competitor <slug> --verify <app-url>'),
    ];
  } else if (needsLogin.length) {
    nextSteps = needsLogin.map((slug) =>
      cmd('competitor-login', `--competitor ${slug} --verify <app-url-after-login>`)
    );
  } else {
    nextSteps = [`Sessions found. Run: ${cmd('competitor-research', '--feature "<name>"')}`];
  }

  console.log(
    JSON.stringify(
      {
        status: 'ready',
        minCloakbrowserVersion: MIN_CLOAKBROWSER_VERSION,
        binary: info,
        sessions,
        nextSteps,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'error', message: err.message || String(err) }, null, 2));
  process.exit(1);
});
