import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverSessionsDir } from './paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SCRIPT = path.join(__dirname, '..', 'discover-server.mjs');

export function daemonMetaPath(repoRoot, sessionId) {
  return path.join(discoverSessionsDir(repoRoot), `${sessionId}.daemon.json`);
}

export function readDaemonMeta(repoRoot, sessionId) {
  const p = daemonMetaPath(repoRoot, sessionId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function isDaemonRunning(repoRoot, sessionId) {
  const meta = readDaemonMeta(repoRoot, sessionId);
  return meta && pidAlive(meta.pid) && meta.port;
}

export async function waitForDaemon(repoRoot, sessionId, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const meta = readDaemonMeta(repoRoot, sessionId);
    if (meta?.port && pidAlive(meta.pid)) return meta;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Discover daemon for "${sessionId}" did not start within ${timeoutMs}ms`);
}

export async function startDaemon(repoRoot, sessionId) {
  if (isDaemonRunning(repoRoot, sessionId)) {
    return readDaemonMeta(repoRoot, sessionId);
  }

  const child = spawn(process.execPath, [SERVER_SCRIPT, '--repo-root', repoRoot, '--session-id', sessionId], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
  child.unref();

  return waitForDaemon(repoRoot, sessionId);
}

export async function daemonRequest(repoRoot, sessionId, body) {
  const meta = readDaemonMeta(repoRoot, sessionId);
  if (!meta?.port || !pidAlive(meta.pid)) {
    const err = new Error(`Discover daemon not running for "${sessionId}". Run launch first.`);
    err.code = 'daemon_not_running';
    throw err;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: meta.port,
        path: '/cmd',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 120000,
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => {
          buf += c;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(buf || '{}');
            if (parsed.status === 'error') {
              const err = new Error(parsed.message || 'daemon error');
              err.code = parsed.code;
              reject(err);
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('daemon request timeout'));
    });
    req.write(data);
    req.end();
  });
}

export async function stopDaemon(repoRoot, sessionId) {
  try {
    if (isDaemonRunning(repoRoot, sessionId)) {
      await daemonRequest(repoRoot, sessionId, { cmd: 'shutdown' });
    }
  } catch {
    /* ignore */
  }
  try {
    fs.unlinkSync(daemonMetaPath(repoRoot, sessionId));
  } catch {
    /* ignore */
  }
}
