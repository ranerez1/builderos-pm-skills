import fs from 'node:fs';
import path from 'node:path';
import {
  ensureDir,
  flowCachePath,
  flowHumanPath,
  flowCacheDir,
  todayISO,
} from './paths.mjs';

const BUILTIN_STATES = new Set(['main', 'create', 'edit', 'empty', 'error', 'detail', 'confirm', 'success']);
const STATE_RE = /^[a-z][a-z0-9-]{0,31}$/;

export function isValidScreenState(state) {
  if (!state || typeof state !== 'string') return false;
  return BUILTIN_STATES.has(state) || STATE_RE.test(state);
}

export function flowCacheExists(repoRoot, featureSlug, competitorSlug) {
  return fs.existsSync(flowCachePath(repoRoot, featureSlug, competitorSlug));
}

export function loadFlowFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Flow file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function isStarterFlow(flow) {
  return (
    flow.screens?.length === 1 &&
    flow.screens[0].state === 'main' &&
    (!flow.screens[0].actions || flow.screens[0].actions.length === 0)
  );
}

export function validateFlow(flow) {
  const errors = [];
  if (flow.version !== 1) errors.push('flow.version must be 1');
  if (!flow.featureSlug) errors.push('featureSlug required');
  if (!flow.competitor) errors.push('competitor required');
  if (!flow.startUrl) errors.push('startUrl required');
  if (!Array.isArray(flow.screens) || flow.screens.length === 0) {
    errors.push('screens must be a non-empty array');
  } else {
    for (const screen of flow.screens) {
      if (!screen.state) errors.push('each screen needs state');
      else if (!isValidScreenState(screen.state)) errors.push(`invalid state "${screen.state}"`);
      if (!Array.isArray(screen.actions)) errors.push(`screen ${screen.state}: actions must be array`);
      if (screen.optional != null && typeof screen.optional !== 'boolean') {
        errors.push(`screen ${screen.state}: optional must be boolean`);
      }
    }
  }
  if (errors.length) throw new Error(`Invalid flow: ${errors.join('; ')}`);
  return flow;
}

export function saveFlow(repoRoot, flow) {
  validateFlow(flow);
  flow.lastVerified = flow.lastVerified || todayISO();
  const dir = flowCacheDir(repoRoot, flow.featureSlug);
  ensureDir(dir);
  const jsonPath = flowCachePath(repoRoot, flow.featureSlug, flow.competitor);
  fs.writeFileSync(jsonPath, `${JSON.stringify(flow, null, 2)}\n`, 'utf8');
  const mdPath = flowHumanPath(repoRoot, flow.featureSlug, flow.competitor);
  fs.writeFileSync(mdPath, renderFlowMarkdown(flow), 'utf8');
  return { jsonPath, mdPath };
}

export function renderFlowMarkdown(flow) {
  const lines = [
    `# Flow: ${flow.feature} — ${flow.competitor}`,
    '',
    `> Pattern: \`${flow.capabilityPattern || 'unknown'}\` · Scope: ${flow.scope || 'unspecified'} · Verified: ${flow.lastVerified || 'n/a'}`,
    '',
    `**Start URL:** ${flow.startUrl}`,
    '',
  ];
  if (flow.notes) lines.push(`${flow.notes}`, '');

  flow.screens.forEach((screen, i) => {
    const optional = screen.optional ? ' _(optional)_' : '';
    const actionDesc =
      screen.actions?.length > 0
        ? screen.actions.map(describeAction).join(' → ')
        : '(land directly)';
    const nav = screen.navigationStrategy ? ` · nav: ${screen.navigationStrategy}` : '';
    lines.push(`${i + 1}. **${screen.state}**${optional} — ${screen.label || screen.state} — ${actionDesc}${nav}`);
    if (screen.url) lines.push(`   - URL: ${screen.url}`);
    if (screen.condition) lines.push(`   - Condition: ${screen.condition}`);
  });

  lines.push('');
  return lines.join('\n');
}

function describeAction(action) {
  if (action.click) {
    const c = action.click;
    if (c.role && c.name) return `Click "${c.name}"`;
    if (c.text) return `Click text "${c.text}"`;
    return 'Click';
  }
  if (action.hover) return `Hover ${action.hover.name || action.hover.role || 'element'}`;
  if (action.goto) return `Go to ${action.goto.url || action.goto}`;
  if (action.fill) return `Fill ${action.fill.label || action.fill.name || 'field'}`;
  if (action.press) return `Press ${action.press.key || action.press}`;
  if (action.wait?.settle) return 'Wait for settle';
  if (action.wait?.ms) return `Wait ${action.wait.ms}ms`;
  return 'Action';
}

/** Build starter flow from feature screens URL (main-only). */
export function starterFlowFromUrl({
  feature,
  featureSlug,
  competitor,
  startUrl,
  capabilityPattern,
  scope,
}) {
  return {
    version: 1,
    feature,
    featureSlug,
    competitor,
    capabilityPattern: capabilityPattern || 'create-resource',
    scope: scope || 'unspecified',
    lastVerified: todayISO(),
    startUrl,
    notes: '',
    screens: [
      {
        state: 'main',
        label: `${feature} — main view`,
        url: startUrl,
        actions: [],
        successSignals: [],
      },
    ],
    forbiddenActions: ['delete_production', 'revoke_all', 'billing_checkout'],
  };
}

export function listFlowCachesForFeature(repoRoot, featureSlug) {
  const dir = flowCacheDir(repoRoot, featureSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f));
}
