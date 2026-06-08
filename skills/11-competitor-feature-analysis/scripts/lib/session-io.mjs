import fs from 'node:fs';
import { discoverSessionPath, ensureDir, discoverSessionsDir } from './paths.mjs';

export function loadSession(repoRoot, sessionId) {
  const p = discoverSessionPath(repoRoot, sessionId);
  if (!fs.existsSync(p)) {
    throw new Error(`Discover session "${sessionId}" not found. Run launch first.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveSession(repoRoot, session) {
  ensureDir(discoverSessionsDir(repoRoot));
  session.updatedAt = new Date().toISOString();
  fs.writeFileSync(discoverSessionPath(repoRoot, session.sessionId), `${JSON.stringify(session, null, 2)}\n`);
}

export function deleteSession(repoRoot, sessionId) {
  try {
    fs.unlinkSync(discoverSessionPath(repoRoot, sessionId));
  } catch {
    /* ignore */
  }
}

export function createSession({
  sessionId,
  competitor,
  feature,
  featureSlug,
  capabilityPattern,
  scope,
  startUrl,
}) {
  return {
    sessionId,
    competitor,
    feature,
    featureSlug,
    capabilityPattern,
    scope: scope || 'unspecified',
    startUrl,
    navigationLog: [],
    pendingScreenActions: [],
    elementRefs: {},
    draftFlow: {
      version: 1,
      feature,
      featureSlug,
      competitor,
      capabilityPattern,
      scope: scope || 'unspecified',
      startUrl,
      notes: '',
      screens: [],
      forbiddenActions: ['delete_production', 'revoke_all', 'billing_checkout'],
    },
    updatedAt: new Date().toISOString(),
  };
}

/** Actions executed since the last captured screen. */
export function actionsSinceLastCapture(session) {
  const screens = session.draftFlow.screens || [];
  const consumed = screens.reduce((n, s) => n + (s.actions?.length || 0), 0);
  return session.navigationLog.slice(consumed);
}

export function appendNavigation(session, action) {
  session.navigationLog.push(action);
}

export function addCapturedScreen(session, { state, label, url, optional, condition, navigationStrategy }) {
  const actions = actionsSinceLastCapture(session);
  const screen = {
    state,
    label: label || state,
    url: url || session.startUrl,
    actions: JSON.parse(JSON.stringify(actions)),
    successSignals: [],
  };
  if (optional) screen.optional = true;
  if (condition) screen.condition = condition;
  if (navigationStrategy) screen.navigationStrategy = navigationStrategy;
  session.draftFlow.screens.push(screen);
}
