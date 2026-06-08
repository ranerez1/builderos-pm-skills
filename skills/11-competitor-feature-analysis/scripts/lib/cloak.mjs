import { launchPersistentContext as cloakLaunchPersistentContext } from 'cloakbrowser';

/**
 * Persistent CloakBrowser context — cookies/localStorage survive across runs.
 * humanize:false for discover/flow automation (avoids timeout burn on bbox fallback).
 */
export async function launchPersistentContext({ userDataDir, headless = true, viewport, humanize = false }) {
  return cloakLaunchPersistentContext({
    userDataDir,
    headless,
    viewport: viewport || { width: 1440, height: 900 },
    humanize,
  });
}
