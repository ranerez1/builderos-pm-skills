import { launchPersistentContext } from './cloak.mjs';
import { ensureCloakBrowser, clearProfileLock } from './setup.mjs';
import { withProfileLock } from './profile-lock.mjs';
import { isLoginPage } from './snapshot.mjs';
import { settlePage } from './settle.mjs';
import { profilesDir, ensureDir } from './paths.mjs';

/**
 * Live auth probe — goto feature URL and check for login wall.
 * Returns { authenticated: boolean, url: string }
 */
export async function probeAuth(repoRoot, competitorSlug, probeUrl) {
  const profilePath = profilesDir(repoRoot, competitorSlug);
  ensureDir(profilePath);
  clearProfileLock(profilePath);
  await ensureCloakBrowser();

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
      await page.goto(probeUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await settlePage(page);
      const onLogin = await isLoginPage(page);
      return { authenticated: !onLogin, url: page.url(), competitor: competitorSlug };
    } finally {
      if (context) await context.close();
    }
  });
}
