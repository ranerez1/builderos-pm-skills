#!/usr/bin/env node
// Tier B video capture (no Gemini): ffmpeg scene-detection with uniform fallback,
// followed by an interactive labeling loop. Skipped frames are deleted so the
// final screenshots/ folder is clean. Emits the same flow.json schema as Tier A.
//
// Usage:
//   node scripts/capture-video-frames.mjs --video=<path-or-platform-url> --feature=<slug> [--env=...] [--goal="..."]
//
// Platform URLs (YouTube, Loom, Vimeo) are downloaded via yt-dlp into a temp
// file before extraction; local file paths are used directly.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import {
  emptyFlow,
  makeStep,
  appendStep,
  writeFlow,
  defaultOutputDir,
  ensureOutputDir,
  findRepoRoot,
  slugify,
} from './lib/flow-io.mjs';
import {
  hasBinary,
  extractSceneFrames,
  extractUniformFrames,
  videoDuration,
} from './lib/ffmpeg.mjs';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [k, ...rest] = raw.slice(2).split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

function isUrl(s) {
  return /^https?:\/\//i.test(s);
}

function runStreamed(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function downloadVideo(url, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const out = path.join(destDir, 'source.%(ext)s');
  await runStreamed('yt-dlp', ['-f', 'mp4/best', '-o', out, url]);
  const files = fs.readdirSync(destDir).filter((f) => f.startsWith('source.'));
  if (!files.length) throw new Error('yt-dlp produced no file');
  return path.join(destDir, files[0]);
}

async function prompt(rl, q, def = '') {
  const suffix = def ? ` [${def}]` : '';
  const answer = (await rl.question(`${q}${suffix}: `)).trim();
  return answer || def;
}

async function promptMulti(rl, q) {
  console.log(`${q} (one per line, blank line to finish):`);
  const out = [];
  while (true) {
    const line = (await rl.question('  - ')).trim();
    if (!line) break;
    out.push(line);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.video) {
    console.error('Missing --video=<path-or-platform-url>');
    process.exit(2);
  }
  if (!args.feature) {
    console.error('Missing --feature=<slug>');
    process.exit(2);
  }

  if (!(await hasBinary('ffmpeg'))) {
    console.error('ffmpeg not found. Install: brew install ffmpeg (macOS) or apt install ffmpeg (Linux).');
    process.exit(3);
  }

  const repoRoot = findRepoRoot();
  const outDir = ensureOutputDir(defaultOutputDir(repoRoot, args.feature));
  const screenshotsDir = path.join(outDir, 'screenshots');
  const flowPath = path.join(outDir, 'flow.json');

  // Resolve the actual video file (download if URL).
  let videoFile = args.video;
  let tempVideoDir = null;
  if (isUrl(args.video)) {
    if (!(await hasBinary('yt-dlp'))) {
      console.error('yt-dlp not found. Install: brew install yt-dlp (macOS) or pip install yt-dlp.');
      process.exit(3);
    }
    tempVideoDir = path.join(os.tmpdir(), `validation-video-${process.pid}`);
    console.log(`Downloading ${args.video} ...`);
    videoFile = await downloadVideo(args.video, tempVideoDir);
  } else if (!fs.existsSync(videoFile)) {
    console.error(`Video not found: ${videoFile}`);
    process.exit(3);
  }

  console.log(`Video: ${videoFile}`);
  const duration = await videoDuration(videoFile);
  console.log(`Duration: ${duration.toFixed(1)}s`);

  // Tier B extraction: scene-detect first, fallback to uniform.
  console.log('Extracting candidate frames via scene-change detection ...');
  const sceneTmp = path.join(screenshotsDir, '_candidates-scene');
  let candidates = await extractSceneFrames(videoFile, sceneTmp);

  if (candidates.length < 4 || candidates.length > 20) {
    console.log(`  scene-detect returned ${candidates.length} frame(s) — falling back to uniform sampling.`);
    // wipe scene candidates
    for (const f of candidates) fs.rmSync(f, { force: true });
    fs.rmSync(sceneTmp, { recursive: true, force: true });
    const uniformTmp = path.join(screenshotsDir, '_candidates-uniform');
    candidates = await extractUniformFrames(videoFile, uniformTmp, { count: 8 });
  }

  console.log(`  ${candidates.length} candidate frame(s) ready for labeling.`);

  // Interactive labeling.
  const rl = readline.createInterface({ input, output });
  const flow = emptyFlow({
    feature: args.feature,
    url: null,
    env: args.env || 'staging',
    goal: args.goal || (await prompt(rl, 'What does "passes" mean in one sentence?')),
    preconditions: await promptMulti(rl, 'Preconditions'),
    capturedVia: 'video',
  });
  writeFlow(flowPath, flow);

  let kept = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    console.log(`\nFrame ${i + 1}/${candidates.length}: ${candidate}`);
    console.log('  (open this file in Preview/Finder to view)');

    const label = await prompt(rl, '  Label (blank = skip this frame)');
    if (!label) {
      fs.rmSync(candidate, { force: true });
      continue;
    }
    const action = await prompt(rl, '  Action taken');
    const expected = await prompt(rl, '  Expected behavior');
    const assertions = await promptMulti(rl, '  Assertions');

    kept += 1;
    const padded = String(kept).padStart(2, '0');
    const slug = slugify(label) || `step-${padded}`;
    const finalRel = path.join('screenshots', `${padded}-${slug}.png`);
    const finalAbs = path.join(outDir, finalRel);
    fs.renameSync(candidate, finalAbs);

    appendStep(
      flow,
      makeStep({ index: kept, label, action, expected, screenshot: finalRel, assertions }),
    );
    writeFlow(flowPath, flow);
    console.log(`  ✓ Saved ${finalRel}`);
  }

  // Clean up candidate dirs and temp video.
  for (const d of ['_candidates-scene', '_candidates-uniform']) {
    fs.rmSync(path.join(screenshotsDir, d), { recursive: true, force: true });
  }
  if (tempVideoDir) fs.rmSync(tempVideoDir, { recursive: true, force: true });

  rl.close();
  console.log(`\nDone. ${kept} step(s) labeled (${candidates.length - kept} frames skipped).`);
  console.log(`flow.json: ${flowPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
