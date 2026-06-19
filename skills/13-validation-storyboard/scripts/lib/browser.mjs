// Vendored from skill 11 (competitor-feature-analysis) `scripts/lib/cloak.mjs`.
// Keep this file minimal — skill 13 only needs a persistent CloakBrowser context
// with screenshot support. No actions / no replay / no snapshot DSL.

import { launchPersistentContext as cloakLaunchPersistentContext } from 'cloakbrowser';

/**
 * Persistent CloakBrowser context — cookies/localStorage survive across runs.
 * Default viewport is 1440x900 so screenshots match typical desktop renders.
 */
export async function launchPersistentContext({
  userDataDir,
  headless = false,
  viewport,
  humanize = false,
} = {}) {
  if (!userDataDir) throw new Error('launchPersistentContext: userDataDir is required');
  return cloakLaunchPersistentContext({
    userDataDir,
    headless,
    viewport: viewport || { width: 1440, height: 900 },
    humanize,
  });
}
