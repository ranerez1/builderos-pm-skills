import fs from 'node:fs';
import path from 'node:path';
import { capabilityPatternDir } from './paths.mjs';

/** Minimal YAML parser for flat capability pattern files. */
function parseSimpleYaml(text) {
  const result = {};
  let currentListKey = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentListKey) {
      result[currentListKey].push(listItem[1].trim());
      continue;
    }

    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const value = kv[2].trim();
      if (value === '') {
        result[key] = [];
        currentListKey = key;
      } else {
        result[key] = value;
        currentListKey = null;
      }
    }
  }
  return result;
}

export function listCapabilityPatterns() {
  const dir = capabilityPatternDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => f.replace(/\.ya?ml$/, ''));
}

export function loadCapabilityPattern(patternId) {
  const dir = capabilityPatternDir();
  for (const ext of ['.yaml', '.yml']) {
    const filePath = path.join(dir, `${patternId}${ext}`);
    if (fs.existsSync(filePath)) {
      const parsed = parseSimpleYaml(fs.readFileSync(filePath, 'utf8'));
      parsed.id = patternId;
      return parsed;
    }
  }
  throw new Error(`Unknown capability pattern "${patternId}". Available: ${listCapabilityPatterns().join(', ')}`);
}

const FEATURE_KEYWORDS = {
  'create-resource': ['add', 'create', 'new', 'compose', 'insert'],
  'configure-setting': ['setting', 'config', 'preference', 'sso', 'webhook', 'environment', 'variable', 'secret', 'integration', 'permission', 'rbac'],
  'list-and-detail': ['list', 'browse', 'detail', 'view', 'log', 'audit', 'history', 'table', 'filter', 'label', 'tag', 'inbox', 'board'],
  'workflow-action': ['publish', 'deploy', 'approve', 'submit', 'run', 'sync', 'export'],
  'empty-state': ['empty', 'first-run', 'onboarding', 'zero'],
};

const COMPOUND_SPLITTERS = /\s*(?:&|\/|\+| and )\s*/i;

function scoreFeature(featureName, patternId, keywords) {
  const lower = featureName.toLowerCase();
  const parts = lower.split(COMPOUND_SPLITTERS).filter(Boolean);
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += 2;
    for (const part of parts) {
      if (part.includes(kw)) score += 1;
    }
  }
  return score;
}

/** Score all patterns; return sorted results with confidence. */
export function scoreCapabilityPatterns(featureName) {
  const ranked = Object.entries(FEATURE_KEYWORDS)
    .map(([id, keywords]) => ({ id, score: scoreFeature(featureName, id, keywords) }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const second = ranked[1];
  const lowConfidence = !top?.score || (second && second.score >= top.score - 1 && second.score > 0);

  return {
    ranked,
    top: top?.score ? top : { id: 'create-resource', score: 0 },
    lowConfidence,
    suggestedPattern: top?.score ? top.id : 'create-resource',
    alternatePattern: second?.score && lowConfidence ? second.id : null,
  };
}

/** Infer best capability pattern from feature name string. */
export function inferCapabilityPattern(featureName) {
  const { suggestedPattern } = scoreCapabilityPatterns(featureName);
  return loadCapabilityPattern(suggestedPattern);
}
