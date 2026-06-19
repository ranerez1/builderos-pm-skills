// Pattern adapted from skill 11 (competitor-feature-analysis) `scripts/lib/flow-io.mjs`.
// Skill 13's flow.json schema is documented in templates/flow.example.json.

import fs from 'node:fs';
import path from 'node:path';

export function readFlow(flowPath) {
  if (!fs.existsSync(flowPath)) return null;
  return JSON.parse(fs.readFileSync(flowPath, 'utf8'));
}

export function writeFlow(flowPath, flow) {
  fs.mkdirSync(path.dirname(flowPath), { recursive: true });
  fs.writeFileSync(flowPath, `${JSON.stringify(flow, null, 2)}\n`);
}

export function emptyFlow({ feature, url = null, env = 'staging', goal = '', preconditions = [], capturedVia }) {
  return {
    feature,
    url,
    captured_at: new Date().toISOString(),
    captured_via: capturedVia,
    preconditions,
    goal,
    env,
    steps: [],
  };
}

export function makeStep({ index, label, action = '', expected = '', screenshot, assertions = [], notes = '' }) {
  const padded = String(index).padStart(2, '0');
  const slug = slugify(label) || `step-${padded}`;
  return {
    id: `${padded}-${slug}`,
    label,
    action,
    expected_behavior: expected,
    screenshot,
    assertions,
    notes,
  };
}

export function appendStep(flow, step) {
  flow.steps.push(step);
  return flow;
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export function defaultOutputDir(repoRoot, feature, date = new Date()) {
  const ymd = date.toISOString().slice(0, 10);
  return path.join(repoRoot, 'Outputs', 'validation-storyboards', `${slugify(feature)}-${ymd}`);
}

export function ensureOutputDir(dir) {
  fs.mkdirSync(path.join(dir, 'screenshots'), { recursive: true });
  return dir;
}

export function findRepoRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'Outputs'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}
