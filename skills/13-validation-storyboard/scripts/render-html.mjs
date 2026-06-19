#!/usr/bin/env node
// Render storyboard.html from flow.json. Self-contained: CSS inline, image
// paths relative. CSS-only :target lightbox for screenshot zoom — zero JS.
// Adapted from skill 11 presentation.mjs template-literal pattern.
//
// Usage:
//   node scripts/render-html.mjs --flow=Outputs/validation-storyboards/<dir>/flow.json

import fs from 'node:fs';
import path from 'node:path';
import { readFlow } from './lib/flow-io.mjs';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [k, ...rest] = raw.slice(2).split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CSS = `
  :root {
    --ink: #1a1a1a;
    --muted: #6b6b6b;
    --paper: #fafaf7;
    --card: #ffffff;
    --border: #e5e3dc;
    --accent: #2563eb;
    --accent-soft: #eff6ff;
    --pass: #16a34a;
    --warn: #d97706;
    --fail: #dc2626;
    --shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
    --radius: 12px;
    --maxw: 1100px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--paper); color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.55; }
  .wrap { max-width: var(--maxw); margin: 0 auto; padding: 48px 24px 96px; }
  header.hero { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 32px; margin-bottom: 32px; box-shadow: var(--shadow); }
  header.hero h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.01em; }
  header.hero .feature-meta { color: var(--muted); font-size: 14px; display: flex; gap: 18px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
  header.hero .meta-pill { background: var(--accent-soft); color: var(--accent); padding: 3px 10px; border-radius: 999px; font-weight: 500; font-size: 12px; }
  header.hero .goal { font-size: 16px; margin: 12px 0 0; }
  header.hero .pre { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }
  header.hero .pre h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
  header.hero .pre ul { margin: 0; padding-left: 20px; font-size: 14px; color: var(--ink); }
  .step { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 0; margin-bottom: 18px; box-shadow: var(--shadow); overflow: hidden; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 0; }
  @media (max-width: 760px) { .step { grid-template-columns: 1fr; } }
  .step .screenshot { background: #0f0f10; display: flex; align-items: center; justify-content: center; min-height: 220px; padding: 16px; }
  .step .screenshot a { display: block; width: 100%; }
  .step .screenshot img { display: block; max-width: 100%; max-height: 380px; margin: 0 auto; border-radius: 6px; object-fit: contain; }
  .step .body { padding: 24px 28px; }
  .step .chip { display: inline-block; background: var(--accent); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.04em; }
  .step h2 { margin: 10px 0 6px; font-size: 19px; letter-spacing: -0.005em; }
  .step .field { margin-top: 14px; }
  .step .field .k { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 4px; }
  .step .field .v { font-size: 14.5px; }
  .step ul.assertions { margin: 4px 0 0; padding-left: 20px; font-size: 14.5px; }
  .step ul.assertions li { margin: 3px 0; }
  .step .notes { color: var(--muted); font-size: 13.5px; font-style: italic; margin-top: 12px; }
  footer { color: var(--muted); font-size: 12px; text-align: center; margin-top: 48px; }
  footer code { background: var(--border); padding: 1px 6px; border-radius: 4px; }
  /* CSS-only lightbox */
  .lb { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
  .lb:target { display: flex; }
  .lb img { max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
  .lb .close { position: absolute; top: 18px; right: 24px; color: #fff; font-size: 30px; text-decoration: none; line-height: 1; opacity: 0.8; }
  .lb .close:hover { opacity: 1; }
`;

function renderStep(step, idx) {
  const num = String(idx + 1).padStart(2, '0');
  const lightboxId = `lb-${step.id}`;
  const assertions = (step.assertions || [])
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join('');
  const screenshotHtml = step.screenshot
    ? `
      <div class="screenshot">
        <a href="#${lightboxId}"><img src="${escapeHtml(step.screenshot)}" alt="${escapeHtml(step.label)}"></a>
      </div>
      <div id="${lightboxId}" class="lb">
        <a href="#" class="close" aria-label="Close">×</a>
        <img src="${escapeHtml(step.screenshot)}" alt="${escapeHtml(step.label)}">
      </div>`
    : '<div class="screenshot"><span style="color:#666;font-size:13px;">No screenshot</span></div>';

  return `
    <article class="step">
      ${screenshotHtml}
      <div class="body">
        <span class="chip">Step ${num}</span>
        <h2>${escapeHtml(step.label)}</h2>
        ${step.action ? `<div class="field"><div class="k">Action</div><div class="v">${escapeHtml(step.action)}</div></div>` : ''}
        ${step.expected_behavior ? `<div class="field"><div class="k">Expected behavior</div><div class="v">${escapeHtml(step.expected_behavior)}</div></div>` : ''}
        ${assertions ? `<div class="field"><div class="k">Assertions</div><ul class="assertions">${assertions}</ul></div>` : ''}
        ${step.notes ? `<div class="notes">${escapeHtml(step.notes)}</div>` : ''}
      </div>
    </article>`;
}

function render(flow) {
  const title = `Validation: ${flow.feature}`;
  const preconditions = (flow.preconditions || [])
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join('');
  const stepsHtml = flow.steps.map((s, i) => renderStep(s, i)).join('\n');
  const capturedDate = flow.captured_at ? new Date(flow.captured_at).toISOString().slice(0, 10) : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <h1>${escapeHtml(title)}</h1>
      <div class="feature-meta">
        ${flow.env ? `<span class="meta-pill">${escapeHtml(flow.env)}</span>` : ''}
        ${flow.captured_via ? `<span>captured via ${escapeHtml(flow.captured_via)}</span>` : ''}
        ${capturedDate ? `<span>${escapeHtml(capturedDate)}</span>` : ''}
        ${flow.url ? `<span><a href="${escapeHtml(flow.url)}" style="color: var(--accent); text-decoration: none;">${escapeHtml(flow.url)}</a></span>` : ''}
      </div>
      ${flow.goal ? `<p class="goal"><strong>Goal:</strong> ${escapeHtml(flow.goal)}</p>` : ''}
      ${preconditions ? `<div class="pre"><h3>Preconditions</h3><ul>${preconditions}</ul></div>` : ''}
    </header>
    ${stepsHtml}
    <footer>
      Generated by <code>/13-validation-storyboard</code> from <code>flow.json</code>. Re-render with <code>node scripts/render-html.mjs --flow=&lt;path&gt;</code>.
    </footer>
  </div>
</body>
</html>`;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.flow) {
    console.error('Missing --flow=<path/to/flow.json>');
    process.exit(2);
  }
  const flow = readFlow(args.flow);
  if (!flow) {
    console.error(`flow.json not found: ${args.flow}`);
    process.exit(2);
  }
  const outDir = path.dirname(args.flow);
  const outPath = path.join(outDir, 'storyboard.html');
  fs.writeFileSync(outPath, render(flow));
  console.log(`Wrote ${outPath}`);
}

main();
