import fs from 'node:fs';
import path from 'node:path';

const LOCK_NAME = '.competitor-profile.lock';
const STALE_MS = 120_000;
const POST_CLOSE_MS = 800;

function lockPath(profilePath) {
  return path.join(profilePath, LOCK_NAME);
}

function pidAlive(pid) {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLock(profilePath) {
  try {
    return JSON.parse(fs.readFileSync(lockPath(profilePath), 'utf8'));
  } catch {
    return null;
  }
}

/** Acquire exclusive lock for a competitor profile directory. */
export async function acquireProfileLock(profilePath, { sessionId = null } = {}) {
  const lp = lockPath(profilePath);
  const now = Date.now();
  const existing = readLock(profilePath);

  if (existing) {
    const age = now - (existing.since || 0);
    if (pidAlive(existing.pid) && age < STALE_MS) {
      const err = new Error(
        `Profile busy for pid ${existing.pid} (session: ${existing.sessionId || 'unknown'}). Close discover session or wait.`
      );
      err.code = 'profile_busy';
      throw err;
    }
    try {
      fs.unlinkSync(lp);
    } catch {
      /* ignore */
    }
  }

  fs.writeFileSync(
    lp,
    `${JSON.stringify({ pid: process.pid, since: now, sessionId }, null, 2)}\n`
  );
}

export function releaseProfileLock(profilePath) {
  try {
    const existing = readLock(profilePath);
    if (existing?.pid === process.pid) {
      fs.unlinkSync(lockPath(profilePath));
    }
  } catch {
    /* ignore */
  }
}

export async function withProfileLock(profilePath, fn, opts = {}) {
  await acquireProfileLock(profilePath, opts);
  try {
    return await fn();
  } finally {
    releaseProfileLock(profilePath);
    await new Promise((r) => setTimeout(r, POST_CLOSE_MS));
  }
}
