// Transcript helpers for video capture.
// - For platform URLs: shell out to yt-dlp to fetch subtitles into a directory.
// - For local video files: look for a sidecar .vtt or .srt in the same dir.
// - Parses VTT (and basic SRT) into [{ start, end, text }] cues.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${cmd} exit ${code}: ${stderr}`))));
  });
}

/**
 * Try to fetch English captions for a platform URL via yt-dlp.
 * Writes a single .vtt file into destDir (yt-dlp chooses a long filename).
 * Returns the path to the .vtt file, or null if no captions available.
 */
export async function fetchCaptionsForUrl(url, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const before = new Set(fs.readdirSync(destDir));
  try {
    await run('yt-dlp', [
      '--write-subs',
      '--write-auto-subs',
      '--sub-format',
      'vtt',
      '--sub-langs',
      'en.*,en-orig',
      '--skip-download',
      '-o',
      path.join(destDir, 'captions.%(ext)s'),
      url,
    ]);
  } catch {
    // yt-dlp returns non-zero if no captions exist — that's expected.
    return null;
  }
  const after = fs.readdirSync(destDir).filter((f) => /\.vtt$/i.test(f) && !before.has(f));
  return after.length ? path.join(destDir, after[0]) : null;
}

/**
 * Look for a sidecar transcript next to a local video file.
 * Returns the path to the sidecar, or null if none found.
 */
export function findSidecarCaptions(videoPath) {
  const base = videoPath.replace(/\.[^./]+$/, '');
  for (const ext of ['.vtt', '.srt', '.VTT', '.SRT']) {
    const candidate = base + ext;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Parse a VTT or SRT file into cues. Tolerant of either format.
 * Returns [{ start, end, text }] with timestamps in seconds (float).
 */
export function parseCaptions(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return parseCaptionsString(raw);
}

export function parseCaptionsString(raw) {
  const lines = raw.replace(/\r/g, '').split('\n');
  const cues = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(
      /(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})/,
    );
    if (m) {
      const start = toSeconds(m[1], m[2], m[3], m[4]);
      const end = toSeconds(m[5], m[6], m[7], m[8]);
      const textLines = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(stripVttFormatting(lines[i]));
        i += 1;
      }
      const text = textLines.join(' ').replace(/\s+/g, ' ').trim();
      if (text) cues.push({ start, end, text });
    }
    i += 1;
  }
  return cues;
}

function toSeconds(hh, mm, ss, ms) {
  const h = hh ? parseInt(hh.replace(':', ''), 10) : 0;
  const m = parseInt(mm, 10);
  const s = parseInt(ss, 10);
  const millis = parseInt((ms || '0').padEnd(3, '0').slice(0, 3), 10);
  return h * 3600 + m * 60 + s + millis / 1000;
}

function stripVttFormatting(line) {
  // Strip <v Speaker> tags, <c.classname> tags, alignment notes like <00:00:01.000>
  return line
    .replace(/<\d{1,2}:\d{2}:\d{2}\.\d{3}>/g, '')
    .replace(/<\/?[cv][^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Get the transcript text covering a window around a timestamp.
 * `windowBefore` and `windowAfter` are in seconds.
 */
export function captionsAround(cues, t, { before = 2, after = 5 } = {}) {
  const lo = t - before;
  const hi = t + after;
  return cues
    .filter((c) => c.end >= lo && c.start <= hi)
    .map((c) => c.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format a cue list as a compact `[start–end] "text"` block, suitable for
 * pasting into an LLM prompt.
 */
export function formatCuesForPrompt(cues, { maxChars = 12000 } = {}) {
  const lines = cues.map((c) => `[${c.start.toFixed(1)}–${c.end.toFixed(1)}] "${c.text}"`);
  let out = lines.join('\n');
  if (out.length > maxChars) out = `${out.slice(0, maxChars)}\n…(transcript truncated for length)…`;
  return out;
}
