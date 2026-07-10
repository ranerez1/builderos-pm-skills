#!/usr/bin/env node
// Render storyboard.html from flow.json — "Inspection Console" aesthetic.
// Self-contained: CSS inline, image paths relative. CSS-only :target lightbox.
// Fonts via Bunny Fonts (Google Fonts mirror); graceful system fallback offline.
// No JavaScript. Re-render anytime by hand-editing flow.json and re-running.

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

// SVG noise overlay (data-URI) for paper-grain atmosphere. Samples a warm
// brown so it reads as paper texture on the light cream background.
const NOISE_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 0 0.07  0 0 0 0.16 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;

const FONT_IMPORT = `@import url('https://fonts.bunny.net/css?family=newsreader:400,500,500i,600|ibm-plex-sans:300,400,500|jetbrains-mono:400,500&display=swap');`;

const CSS = `
  ${FONT_IMPORT}

  :root {
    --ink:           #1a1814;
    --ink-soft:      #5f5b54;
    --ink-faint:     #9b968d;
    --paper:         #faf7f0;
    --paper-edge:    #f1ece0;
    --surface:       #ffffff;
    --surface-edge:  rgba(26, 24, 20, 0.10);
    --hairline:      rgba(26, 24, 20, 0.08);
    --accent:        #b65a1d;
    --accent-soft:   rgba(182, 90, 29, 0.08);
    --pass:          #1f9d55;
    --shot-well:     #1a1814;

    --f-display:     'Newsreader', Georgia, 'Iowan Old Style', 'Charter', serif;
    --f-body:        'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --f-mono:        'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;

    --maxw: 1140px;
    --radius: 4px;
  }

  * { box-sizing: border-box; }
  html { background: var(--paper); }
  body {
    margin: 0;
    padding: 0;
    color: var(--ink);
    font-family: var(--f-body);
    font-weight: 400;
    line-height: 1.6;
    font-size: 15px;
    letter-spacing: 0;
    background:
      radial-gradient(circle at 50% 0%, var(--paper) 0%, var(--paper-edge) 80%) fixed,
      var(--paper);
    min-height: 100vh;
  }
  /* Soft paper grain over the whole page */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image: url("${NOISE_SVG}");
    opacity: 0.05;
    z-index: 0;
    mix-blend-mode: multiply;
  }
  .wrap { position: relative; z-index: 1; max-width: var(--maxw); margin: 0 auto; padding: 72px 32px 96px; }

  /* HERO ================================================================== */
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 48px 56px;
    margin-bottom: 72px;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--hairline);
    animation: hero-in 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .hero .doc-meta {
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin: 0 0 18px;
  }
  .hero .doc-meta .dot { color: var(--accent); margin: 0 8px; }
  .hero h1 {
    font-family: var(--f-display);
    font-weight: 500;
    font-size: clamp(36px, 5.5vw, 64px);
    line-height: 1.04;
    letter-spacing: -0.02em;
    margin: 0 0 24px;
    color: var(--ink);
  }
  .hero h1 .subtle {
    color: var(--ink-faint);
    font-style: italic;
    font-weight: 400;
  }
  .hero .goal {
    margin: 0;
    padding: 4px 0 4px 16px;
    border-left: 2px solid var(--accent);
    font-family: var(--f-display);
    font-style: italic;
    font-size: 19px;
    line-height: 1.45;
    color: var(--ink);
    max-width: 60ch;
  }
  .hero .goal::before {
    content: 'Goal · ';
    font-family: var(--f-mono);
    font-style: normal;
    font-size: 11px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-right: 6px;
    vertical-align: 4px;
  }

  .hero .col-right { min-width: 220px; }
  .hero .pills {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
    margin-bottom: 24px;
  }
  .hero .pill {
    font-family: var(--f-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    padding: 5px 12px;
    border: 1px solid var(--surface-edge);
    border-radius: 999px;
    text-transform: lowercase;
    white-space: nowrap;
  }
  .hero .pill.env { color: var(--accent); border-color: rgba(245, 158, 11, 0.4); }
  .hero .pill a { color: inherit; text-decoration: none; }
  .hero .pre h3 {
    font-family: var(--f-mono);
    font-size: 10px;
    font-weight: 500;
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin: 0 0 12px;
    text-align: right;
  }
  .hero .pre ol {
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: right;
  }
  .hero .pre ol li {
    font-size: 13px;
    line-height: 1.6;
    color: var(--ink-soft);
    margin: 4px 0;
  }

  @media (max-width: 880px) {
    .hero { grid-template-columns: 1fr; gap: 40px; }
    .hero .col-right .pills { align-items: flex-start; }
    .hero .pre h3, .hero .pre ol { text-align: left; }
  }

  /* STEPS ================================================================= */
  .steps { display: flex; flex-direction: column; gap: 56px; }

  .step {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 0 32px;
    align-items: start;
    opacity: 0;
    animation: step-in 500ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
    animation-delay: calc(180ms + var(--i, 0) * 70ms);
  }
  .step .rail {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--accent);
    line-height: 1;
    padding-top: 4px;
    text-align: right;
    position: relative;
  }
  .step .rail::after {
    content: '';
    display: block;
    width: 1px;
    height: 100%;
    background: var(--hairline);
    position: absolute;
    right: -16px;
    top: 28px;
    bottom: -56px;
  }
  .step:last-child .rail::after { display: none; }

  .step .content {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 0;
    background: var(--surface);
    border: 1px solid var(--surface-edge);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(26, 24, 20, 0.03), 0 8px 24px rgba(26, 24, 20, 0.06);
  }
  @media (max-width: 760px) {
    .step { grid-template-columns: 40px minmax(0, 1fr); gap: 0 16px; }
    .step .content { grid-template-columns: 1fr; }
    .step .rail::after { right: -12px; }
  }

  .step .frame {
    background: var(--shot-well);
    background-image:
      linear-gradient(180deg, rgba(255,255,255,0.04), transparent 40%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
    min-height: 240px;
    border-right: 1px solid var(--surface-edge);
    position: relative;
    transition: box-shadow 220ms ease;
  }
  @media (max-width: 760px) { .step .frame { border-right: none; border-bottom: 1px solid var(--surface-edge); } }
  .step .frame:hover {
    box-shadow: inset 0 0 0 1px rgba(182, 90, 29, 0.5);
  }
  .step .frame a {
    display: block;
    width: 100%;
    transition: transform 220ms ease;
  }
  .step .frame a:hover { transform: scale(1.01); }
  .step .frame img {
    display: block;
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    border-radius: 2px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.06),
      0 8px 24px rgba(0,0,0,0.35);
  }
  .step .frame .no-shot {
    color: #a8a59a;
    font-family: var(--f-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .step .body { padding: 32px 36px 36px; }
  .step .body .step-no {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--accent);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 6px;
  }
  .step .body h2 {
    font-family: var(--f-display);
    font-weight: 500;
    font-size: 26px;
    line-height: 1.2;
    letter-spacing: -0.005em;
    margin: 0 0 22px;
    color: var(--ink);
  }
  .step .field { margin-top: 18px; }
  .step .field .k {
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin: 0 0 6px;
    font-weight: 500;
  }
  .step .field .v {
    font-size: 14.5px;
    color: var(--ink);
    line-height: 1.55;
  }

  /* Checklist to validate — written-manifest treatment */
  .step .checklist { list-style: none; padding: 0; margin: 6px 0 0; counter-reset: chk; }
  .step .checklist li {
    counter-increment: chk;
    padding: 12px 0 12px 36px;
    border-bottom: 1px solid var(--hairline);
    position: relative;
    font-size: 14.5px;
    line-height: 1.5;
    color: var(--ink);
  }
  .step .checklist li:last-child { border-bottom: none; }
  .step .checklist li::before {
    content: counter(chk, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 14px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--ink-faint);
    letter-spacing: 0.08em;
  }

  .step .notes {
    margin-top: 18px;
    padding: 12px 16px;
    background: var(--accent-soft);
    border-left: 2px solid var(--accent);
    font-family: var(--f-display);
    font-style: italic;
    font-size: 14px;
    color: var(--ink-soft);
  }

  /* FOOTER ================================================================ */
  footer {
    margin-top: 96px;
    padding-top: 28px;
    border-top: 1px solid var(--hairline);
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--ink-faint);
    letter-spacing: 0.06em;
    line-height: 1.8;
  }
  footer .stamp { color: var(--accent); }
  footer code {
    color: var(--ink-soft);
    background: rgba(26, 24, 20, 0.04);
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid var(--hairline);
  }

  /* LIGHTBOX (CSS-only :target) =========================================== */
  .lb {
    position: fixed; inset: 0;
    background: rgba(26, 24, 20, 0.88);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 32px;
  }
  .lb:target { display: flex; }
  .lb img {
    max-width: 100%;
    max-height: 100%;
    box-shadow: 0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
  }
  .lb .close {
    position: absolute;
    top: 22px;
    right: 28px;
    color: #f0ebe0;
    font-family: var(--f-mono);
    font-size: 12px;
    text-decoration: none;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 3px;
  }
  .lb .close:hover { color: #fff; border-color: #fff; }

  /* ANIMATIONS ============================================================ */
  @keyframes hero-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes step-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function renderStep(step, idx) {
  const num = String(idx + 1).padStart(2, '0');
  const lightboxId = `lb-${step.id}`;
  const checklist = (step.assertions || [])
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join('');
  const frameInner = step.screenshot
    ? `
          <a href="#${lightboxId}"><img src="${escapeHtml(step.screenshot)}" alt="${escapeHtml(step.label)}"></a>
        </div>
        <div id="${lightboxId}" class="lb">
          <a href="#" class="close">close</a>
          <img src="${escapeHtml(step.screenshot)}" alt="${escapeHtml(step.label)}">`
    : `<span class="no-shot">No screenshot</span>`;

  return `
      <div class="step" style="--i: ${idx};">
        <div class="rail">${num}</div>
        <div class="content">
          <div class="frame">${frameInner}
        </div>
        <div class="body">
          <p class="step-no">Step ${num}</p>
          <h2>${escapeHtml(step.label)}</h2>
          ${step.action ? `<div class="field"><div class="k">Action</div><div class="v">${escapeHtml(step.action)}</div></div>` : ''}
          ${step.expected_behavior ? `<div class="field"><div class="k">Expected behavior</div><div class="v">${escapeHtml(step.expected_behavior)}</div></div>` : ''}
          ${checklist ? `<div class="field"><div class="k">Checklist to validate</div><ol class="checklist">${checklist}</ol></div>` : ''}
          ${step.notes ? `<div class="notes">${escapeHtml(step.notes)}</div>` : ''}
        </div>
      </div>
    </div>`;
}

function render(flow) {
  const title = flow.feature;
  const preconditions = (flow.preconditions || [])
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join('');
  const stepsHtml = flow.steps.map((s, i) => renderStep(s, i)).join('\n');
  const capturedDate = flow.captured_at ? new Date(flow.captured_at).toISOString().slice(0, 10) : '';
  const stepCount = (flow.steps || []).length;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Validation · ${escapeHtml(title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <div class="col-left">
        <p class="doc-meta">Validation Manifest <span class="dot">·</span> ${stepCount} step${stepCount === 1 ? '' : 's'}${capturedDate ? ` <span class="dot">·</span> ${escapeHtml(capturedDate)}` : ''}</p>
        <h1>${escapeHtml(title)}</h1>
        ${flow.goal ? `<p class="goal">${escapeHtml(flow.goal)}</p>` : ''}
      </div>
      <div class="col-right">
        <div class="pills">
          ${flow.env ? `<span class="pill env">${escapeHtml(flow.env)}</span>` : ''}
          ${flow.captured_via ? `<span class="pill">captured via ${escapeHtml(flow.captured_via)}</span>` : ''}
          ${flow.url ? `<span class="pill"><a href="${escapeHtml(flow.url)}">${escapeHtml(flow.url.replace(/^https?:\/\//, ''))}</a></span>` : ''}
        </div>
        ${preconditions ? `<div class="pre"><h3>Preconditions</h3><ol>${preconditions}</ol></div>` : ''}
      </div>
    </header>
    <section class="steps">
${stepsHtml}
    </section>
    <footer>
      <span class="stamp">/13-validation-storyboard</span> <span style="color:var(--ink-faint)">·</span> generated from <code>flow.json</code><br>
      Re-render with <code>node scripts/render-html.mjs --flow=&lt;path&gt;</code>
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
