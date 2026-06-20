#!/usr/bin/env node
// Orchestrator: dispatch on --url vs --video, run the right capture script,
// then always run both renderers. For video mode, detects GEMINI_API_KEY to
// pick between Tier A (Python + Gemini) and Tier B (ffmpeg fallback).
//
// Usage:
//   node scripts/main.mjs --url=<https://...> --feature=<slug> [--env=...] [--goal="..."]
//   node scripts/main.mjs --video=<path-or-url> --feature=<slug> [--env=...] [--goal="..."]

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import {
  defaultOutputDir,
  ensureOutputDir,
  findRepoRoot,
} from './lib/flow-io.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [k, ...rest] = raw.slice(2).split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} → exit ${code}`))));
  });
}

function geminiAvailable() {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.feature) {
    console.error('Missing --feature=<slug>');
    process.exit(2);
  }
  if (!args.url && !args.video) {
    console.error('Provide exactly one of --url=<...> or --video=<path-or-url>');
    process.exit(2);
  }
  if (args.url && args.video) {
    console.error('--url and --video are mutually exclusive');
    process.exit(2);
  }

  const repoRoot = findRepoRoot();
  const outDir = ensureOutputDir(defaultOutputDir(repoRoot, args.feature));
  const flowPath = path.join(outDir, 'flow.json');

  // ---- Capture phase ---------------------------------------------------------
  if (args.url) {
    // Default to auto-walk (headless, no user input). --interactive opts into
    // the manual walk-and-label flow.
    const captureScript = args.interactive ? 'capture-url-interactive.mjs' : 'capture-url-auto.mjs';
    if (args.interactive) {
      console.log('Interactive mode: a browser will open and you will walk the flow yourself.');
    } else {
      console.log('Auto-walk mode: headless capture of discovered page sections. Pass --interactive to walk the flow yourself, --headed to watch the browser.');
    }
    const captureArgs = [path.join(__dirname, captureScript)];
    for (const k of ['url', 'feature', 'env', 'goal', 'headless', 'headed', 'preconditions', 'max-sections']) {
      if (args[k] !== undefined) {
        const v = args[k];
        captureArgs.push(v === true ? `--${k}` : `--${k}=${v}`);
      }
    }
    await run('node', captureArgs);
  } else {
    if (geminiAvailable()) {
      console.log('GEMINI_API_KEY detected — using Tier A (Gemini step segmentation).');
      const captureArgs = [
        path.join(__dirname, 'capture-video.py'),
        `--video=${args.video}`,
        `--feature=${args.feature}`,
        `--out=${outDir}`,
        `--env=${args.env || 'staging'}`,
        `--goal=${args.goal || ''}`,
      ];
      await run('python3', captureArgs);
    } else {
      console.log('No GEMINI_API_KEY found — falling back to Tier B (ffmpeg + interactive labeling).');
      console.log('Set GEMINI_API_KEY to enable automatic step segmentation.\n');
      const captureArgs = [path.join(__dirname, 'capture-video-frames.mjs')];
      for (const k of ['video', 'feature', 'env', 'goal']) {
        if (args[k] !== undefined) captureArgs.push(`--${k}=${args[k]}`);
      }
      await run('node', captureArgs);
    }
  }

  if (!fs.existsSync(flowPath)) {
    console.error(`Capture finished but flow.json was not written: ${flowPath}`);
    process.exit(4);
  }

  // ---- Render phase ----------------------------------------------------------
  await run('node', [path.join(__dirname, 'render-html.mjs'), `--flow=${flowPath}`]);
  await run('node', [path.join(__dirname, 'render-md.mjs'), `--flow=${flowPath}`]);

  // ---- Report ----------------------------------------------------------------
  const flow = JSON.parse(fs.readFileSync(flowPath, 'utf8'));
  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`✓ Validation storyboard ready (${flow.steps.length} steps)`);
  console.log(`  ${path.relative(repoRoot, path.join(outDir, 'storyboard.html'))}`);
  console.log(`  ${path.relative(repoRoot, path.join(outDir, 'validation.md'))}`);
  console.log(`  ${path.relative(repoRoot, flowPath)}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log('Open storyboard.html to review, or hand validation.md to an agent.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
