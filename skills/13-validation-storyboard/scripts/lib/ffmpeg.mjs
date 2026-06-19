// Thin wrappers around ffmpeg / ffprobe for frame extraction.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function hasBinary(bin) {
  return new Promise((resolve) => {
    const p = spawn(process.platform === 'win32' ? 'where' : 'which', [bin]);
    p.on('exit', (code) => resolve(code === 0));
    p.on('error', () => resolve(false));
  });
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    p.on('error', reject);
    p.on('exit', (code) => {
      if (code !== 0) reject(new Error(`${cmd} exited ${code}: ${stderr}`));
      else resolve({ stdout, stderr });
    });
  });
}

/** Returns duration in seconds (float). */
export async function videoDuration(videoPath) {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ]);
  return parseFloat(stdout.trim());
}

/**
 * Extract scene-change frames. Writes PNGs into `outDir` named scene-001.png …
 * Returns the list of written file paths.
 */
export async function extractSceneFrames(videoPath, outDir, { threshold = 0.3 } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const pattern = path.join(outDir, 'scene-%03d.png');
  await run('ffmpeg', [
    '-y',
    '-i',
    videoPath,
    '-vf',
    `select='gt(scene,${threshold})'`,
    '-vsync',
    'vfr',
    pattern,
  ]);
  return fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith('scene-') && f.endsWith('.png'))
    .sort()
    .map((f) => path.join(outDir, f));
}

/**
 * Extract `count` frames evenly spaced across the video.
 * Names them uniform-001.png … inside outDir.
 */
export async function extractUniformFrames(videoPath, outDir, { count = 8 } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const duration = await videoDuration(videoPath);
  const step = duration / (count + 1);
  const out = [];
  for (let i = 1; i <= count; i += 1) {
    const t = (step * i).toFixed(2);
    const fname = path.join(outDir, `uniform-${String(i).padStart(3, '0')}.png`);
    await run('ffmpeg', ['-y', '-ss', t, '-i', videoPath, '-frames:v', '1', '-q:v', '2', fname]);
    out.push(fname);
  }
  return out;
}

/**
 * Extract a single frame at the given timestamp (in seconds).
 */
export async function extractFrameAt(videoPath, outPath, seconds) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await run('ffmpeg', ['-y', '-ss', String(seconds), '-i', videoPath, '-frames:v', '1', '-q:v', '2', outPath]);
  return outPath;
}
