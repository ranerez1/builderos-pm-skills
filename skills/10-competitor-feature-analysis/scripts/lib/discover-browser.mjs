import { launchPersistentContext } from './cloak.mjs';
import { runActions, runAction, resolveLocatorWithSession } from './actions.mjs';
import { settlePage } from './settle.mjs';
import { captureSnapshot, isLoginPage } from './snapshot.mjs';
import { clearProfileLock, ensureCloakBrowser } from './setup.mjs';
import { withProfileLock } from './profile-lock.mjs';
import { profilesDir, ensureDir } from './paths.mjs';

/**
 * Replay navigation log. When pendingAction is set, replay all but the last entry
 * then execute pending once (avoids double-click on toggles/modals).
 */
export async function replayToState(page, session, { pendingAction = null } = {}) {
  const log = session.navigationLog || [];
  if (pendingAction && log.length > 0) {
    const prior = log.slice(0, -1);
    if (prior.length) await runActions(page, prior);
    await runAction(page, pendingAction);
    await settlePage(page);
    return;
  }
  if (log.length) await runActions(page, log);
}

export async function withDiscoverPage(repoRoot, session, fn, { headless = true, pendingAction = null } = {}) {
  const profilePath = profilesDir(repoRoot, session.competitor);
  ensureDir(profilePath);
  clearProfileLock(profilePath);
  await ensureCloakBrowser();

  return withProfileLock(profilePath, async () => {
    let context;
    try {
      context = await launchPersistentContext({
        userDataDir: profilePath,
        headless,
        viewport: { width: 1440, height: 900 },
        humanize: false,
      });
      const page = context.pages()[0] || (await context.newPage());
      await page.goto(session.startUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await settlePage(page);

      await replayToState(page, session, { pendingAction });

      if (await isLoginPage(page)) {
        const err = new Error(`auth_required for ${session.competitor}`);
        err.code = 'auth_required';
        throw err;
      }

      return await fn(page, context);
    } finally {
      if (context) await context.close();
    }
  }, { sessionId: session.sessionId });
}

export async function executeDiscoverClick(page, session, locatorSpec) {
  if (locatorSpec.ref) {
    const loc = await resolveLocatorWithSession(page, session, locatorSpec);
    await loc.first().click({ timeout: 30000 });
  } else {
    await runAction(page, { click: locatorSpec });
  }
  await settlePage(page);
}

export async function executeDiscoverFill(page, session, locatorSpec, value) {
  const spec = { ...locatorSpec, value };
  if (locatorSpec.ref) {
    const loc = await resolveLocatorWithSession(page, session, locatorSpec);
    await loc.first().fill(String(value), { timeout: 30000 });
  } else {
    await runAction(page, { fill: spec });
  }
}

export async function executeDiscoverHover(page, session, locatorSpec) {
  const loc = locatorSpec.ref
    ? await resolveLocatorWithSession(page, session, locatorSpec)
    : (await import('./actions.mjs')).resolveLocator(page, locatorSpec);
  await loc.first().hover({ timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
}
