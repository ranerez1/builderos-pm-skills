import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Workspace root. Walks up from the skill dir looking for a marker (.git/ or a
 * non-skill package.json), so the skill works at any install depth. Falls back
 * to the legacy five-levels-up when no marker is found.
 */
export function findRepoRoot() {
  const skillDir = path.resolve(__dirname, '../..'); // scripts/lib → skill root
  const fallback = path.resolve(skillDir, '..', '..', '..'); // legacy 5-levels-up
  let cur = skillDir;
  for (let i = 0; i < 8; i++) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
    const hasGit = fs.existsSync(path.join(cur, '.git'));
    const hasPkg =
      fs.existsSync(path.join(cur, 'package.json')) &&
      !cur.includes(`${path.sep}skills${path.sep}`);
    if (hasGit || hasPkg) return cur;
  }
  return fallback;
}

/**
 * Skill dir as the workspace would reference it — e.g. ".cursor/skills/10-…" (Cursor) or
 * ".claude/skills/10-…" (Claude Code). Falls back to an absolute path for out-of-tree installs
 * (e.g. a global ~/.claude/skills), so emitted commands always point at the real folder.
 */
export function skillDirRel() {
  const rel = path.relative(findRepoRoot(), skillRoot());
  return !rel || rel.startsWith('..') ? skillRoot() : rel;
}

/** Portable invocation prefix that matches the actual install location. */
export function skillInvoke() {
  return `npm --prefix ${skillDirRel()} run`;
}

/** Build a portable command string for agent/user guidance. */
export function cmd(name, rest = '') {
  return `${skillInvoke()} ${name}${rest ? ` -- ${rest}` : ''}`;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultRunDir(repoRoot, feature, date = todayISO()) {
  const featureSlug = slugify(feature);
  return path.join(repoRoot, 'Outputs', 'competitor-research', `${featureSlug}-${date}`);
}

export function competitorsPath(repoRoot) {
  return path.join(repoRoot, 'Knowledge', 'competitors.md');
}

export function profilesDir(repoRoot, competitorSlug) {
  return path.join(repoRoot, '.cloak-profiles', competitorSlug);
}

export function skillRoot() {
  return path.resolve(__dirname, '../..');
}

export function flowCacheDir(repoRoot, featureSlug) {
  return path.join(repoRoot, 'Knowledge', 'competitor-flows', featureSlug);
}

export function flowCachePath(repoRoot, featureSlug, competitorSlug) {
  return path.join(flowCacheDir(repoRoot, featureSlug), `${competitorSlug}.json`);
}

export function flowHumanPath(repoRoot, featureSlug, competitorSlug) {
  return path.join(flowCacheDir(repoRoot, featureSlug), `${competitorSlug}.flow.md`);
}

export function capabilityPatternDir() {
  return path.join(skillRoot(), 'capability-patterns');
}

export function discoverSessionsDir(repoRoot) {
  return path.join(repoRoot, '.cloak-profiles', '.discover-sessions');
}

export function discoverSessionPath(repoRoot, sessionId) {
  return path.join(discoverSessionsDir(repoRoot), `${sessionId}.json`);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(token);
    }
  }
  return { args, positional };
}
