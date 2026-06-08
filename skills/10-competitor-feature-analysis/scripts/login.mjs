#!/usr/bin/env node
/**
 * Open CloakBrowser (headed) for manual OAuth/login; session persists in .cloak-profiles/{slug}/.
 * Must run in an interactive terminal (stdin Enter after login). Do not run in agent background shells.
 */
import readline from 'node:readline';
import path from 'node:path';
import {
  findRepoRoot,
  competitorsPath,
  profilesDir,
  ensureDir,
  parseArgs,
} from './lib/paths.mjs';
import { loadCompetitors, validateCompetitorsConfig } from './lib/competitors.mjs';
import { launchPersistentContext } from './lib/cloak.mjs';
import { ensureCloakBrowser, clearProfileLock } from './lib/setup.mjs';

function printHelp() {
  console.log(`Usage: competitor-login [options]

Options:
  --competitor <slug>   Competitor slug from Knowledge/competitors.md (required)
  --url <login-url>     Override login URL (default: from competitors.md)
  --verify <url>        URL to open after login to verify session (default: none)
  --help                Show this help

Opens a headed CloakBrowser window. Log in manually, then press Enter in this terminal.
Session is saved under .cloak-profiles/{slug}/ for later headless captures.
`);
}

async function isLoginPage(page) {
  const url = page.url();
  if (/login|signin|sign-in|auth\/login|oauth/i.test(url)) return true;
  const passwordField = await page.locator('input[type="password"]').count();
  return passwordField > 0;
}

async function waitForEnter(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const competitor = args.competitor;
  if (!competitor) {
    printHelp();
    process.exit(1);
  }

  const repoRoot = findRepoRoot();
  const config = loadCompetitors(competitorsPath(repoRoot));
  validateCompetitorsConfig(config);

  const entry = config.competitors[competitor];
  if (!entry) {
    throw new Error(`Unknown competitor "${competitor}".`);
  }

  const loginUrl = args.url || entry.loginUrl;
  const verifyUrl = args.verify || null;
  const profilePath = profilesDir(repoRoot, competitor);
  ensureDir(profilePath);
  clearProfileLock(profilePath);

  await ensureCloakBrowser();

  console.error(`\nOpening CloakBrowser for ${entry.name} (${competitor})`);
  console.error(`Profile: ${path.relative(repoRoot, profilePath)}`);
  console.error(`Login URL: ${loginUrl}\n`);

  let context;
  try {
    context = await launchPersistentContext({
      userDataDir: profilePath,
      headless: false,
      viewport: { width: 1440, height: 900 },
      humanize: true,
    });

    const page = context.pages()[0] || (await context.newPage());
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));

    const title = await page.title();
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/couldn't load the required files/i.test(bodyText)) {
      console.error(
        'Warning: Todoist reported a load error. Check network/VPN, wait a few seconds, refresh the page in the browser, then log in.'
      );
    }

    console.error(`Page title: ${title}`);
    console.error(`Current URL: ${page.url()}`);
    console.error('\n1. Complete login in the browser window (Google/Apple/email).');
    console.error('2. Wait until you land in the app (not the login form).');
    console.error('3. Return here and press Enter.\n');

    await waitForEnter('Press Enter after login is complete... ');

    if (verifyUrl) {
      await page.goto(verifyUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 3000));
    }

    const finalUrl = page.url();
    const stillLogin = await isLoginPage(page);

    const result = {
      status: stillLogin ? 'auth_incomplete' : 'auth_complete',
      competitor,
      loginUrl,
      finalUrl,
      profilePath: path.relative(repoRoot, profilePath),
      message: stillLogin
        ? 'Still on a login page. Try again or check credentials.'
        : 'Session saved. Run competitor-screenshot without --headed.',
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(stillLogin ? 2 : 0);
  } finally {
    if (context) await context.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
