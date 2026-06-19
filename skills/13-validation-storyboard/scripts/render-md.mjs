#!/usr/bin/env node
// Render validation.md from flow.json. Platform-agnostic prose so any AI agent
// (Claude with browser MCP, Playwright bot, human QA) can pick it up and run.
//
// Usage:
//   node scripts/render-md.mjs --flow=Outputs/validation-storyboards/<dir>/flow.json

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

function renderStep(step, idx) {
  const num = String(idx + 1).padStart(2, '0');
  const lines = [];
  lines.push(`### Step ${num} — ${step.label}`);
  lines.push('');
  if (step.action) {
    lines.push(`**Action:** ${step.action}`);
    lines.push('');
  }
  if (step.expected_behavior) {
    lines.push(`**Expected:** ${step.expected_behavior}`);
    lines.push('');
  }
  if (step.assertions && step.assertions.length) {
    lines.push('**Assertions:**');
    for (const a of step.assertions) lines.push(`- ${a}`);
    lines.push('');
  }
  if (step.screenshot) {
    lines.push(`**Screenshot:** ![Step ${num}](${step.screenshot})`);
    lines.push('');
  }
  if (step.notes) {
    lines.push(`> ${step.notes}`);
    lines.push('');
  }
  return lines.join('\n');
}

function render(flow) {
  const out = [];
  out.push(`# Validation: ${flow.feature}${flow.env ? ` — ${flow.env}` : ''}`);
  out.push('');
  if (flow.goal) {
    out.push(`**Goal:** ${flow.goal}`);
    out.push('');
  }
  if (flow.url) {
    out.push(`**URL:** ${flow.url}`);
    out.push('');
  }
  if (flow.captured_at) {
    out.push(`**Captured:** ${flow.captured_at} (via ${flow.captured_via || 'unknown'})`);
    out.push('');
  }
  if (flow.preconditions && flow.preconditions.length) {
    out.push('## Preconditions');
    out.push('');
    for (const p of flow.preconditions) out.push(`- ${p}`);
    out.push('');
  }
  out.push('## How to run this validation');
  out.push('');
  out.push('Walk each step in order. For each: perform the action, then check that every assertion holds. Note any deviations. Reference the screenshot to confirm you are on the expected screen.');
  out.push('');
  out.push(`A runtime that can drive a browser (Claude Code with a browser MCP, Playwright, a human QA tester) can execute these steps directly. The companion \`storyboard.html\` in the same folder is a human-friendly view of the same content. The source of truth is \`flow.json\`.`);
  out.push('');
  out.push('## Steps');
  out.push('');
  for (let i = 0; i < flow.steps.length; i += 1) {
    out.push(renderStep(flow.steps[i], i));
    if (i < flow.steps.length - 1) {
      out.push('---');
      out.push('');
    }
  }
  return out.join('\n');
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
  const outPath = path.join(outDir, 'validation.md');
  fs.writeFileSync(outPath, render(flow));
  console.log(`Wrote ${outPath}`);
}

main();
