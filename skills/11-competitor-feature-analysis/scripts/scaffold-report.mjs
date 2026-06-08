#!/usr/bin/env node
/**
 * Scaffold comparison MD + JSON from capture manifest and flow caches.
 */
import fs from 'node:fs';
import path from 'node:path';
import { findRepoRoot, parseArgs, todayISO, cmd } from './lib/paths.mjs';
import { loadFlowFile } from './lib/flow-io.mjs';

function printHelp() {
  console.log(`Usage: competitor-scaffold-report [options]

Options:
  --manifest <path>   capture-manifest.json (required)
  --help

Writes:
  {run-dir}/{feature-slug}-comparison-{date}.md
  {run-dir}/{feature-slug}-comparison-{date}.json
`);
}

function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help || !args.manifest) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const repoRoot = findRepoRoot();
  const manifestPath = path.isAbsolute(args.manifest)
    ? args.manifest
    : path.join(repoRoot, args.manifest);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const runDir = path.isAbsolute(manifest.runDir) ? manifest.runDir : path.join(repoRoot, manifest.runDir);
  const date = todayISO();
  const baseName = `${manifest.featureSlug}-comparison-${date}`;
  const competitors = manifest.competitors.map((c) => c.slug);

  const flows = [];
  for (const entry of manifest.competitors) {
    const flowPath = path.join(
      repoRoot,
      'Knowledge/competitor-flows',
      manifest.featureSlug,
      `${entry.slug}.json`
    );
    if (!fs.existsSync(flowPath)) continue;

    const flow = loadFlowFile(flowPath);
    const steps = (entry.captures?.length ? entry.captures : flow.screens).map((screen) => {
      const state = screen.state;
      const shotPath = screen.screenshotPath || `screenshots/${entry.slug}-${state}.png`;
      return {
        state,
        path: shotPath,
        url: screen.url || '',
        caption: `[NEED: one-line caption for ${state}]`,
      };
    });

    flows.push({
      competitor: entry.slug,
      label: `${entry.slug} — ${manifest.feature}`,
      steps,
    });
  }

  const json = {
    type: 'comparison',
    feature: manifest.feature,
    featureSlug: manifest.featureSlug,
    date,
    runDir: manifest.runDir,
    competitors,
    summary: '[NEED: one-sentence headline takeaway]',
    keyInsights: [
      { title: '[NEED: insight title]', detail: '[NEED: evidence sentence]' },
    ],
    capabilities: [
      {
        name: '[NEED: differentiator capability]',
        ...Object.fromEntries(competitors.map((c) => [c, '[NEED: Yes/No/Partial — detail]'])),
      },
    ],
    flows,
  };

  const mdLines = [
    `# Competitor comparison: ${manifest.feature}`,
    '',
    `> **Date:** ${date} | **Competitors:** ${competitors.join(', ')}`,
    '',
    '## Summary',
    '',
    '[NEED: one or two sentences — headline takeaway]',
    '',
    '## Key insights',
    '',
    '1. **[NEED: claim]** — [NEED: evidence].',
    '',
    '## Capability comparison',
    '',
    `| Capability | ${competitors.join(' | ')} |`,
    `|------------|${competitors.map(() => '---').join('|')}|`,
    `| [NEED: row] | ${competitors.map(() => '[NEED]').join(' | ')} |`,
    '',
    '## Flows',
    '',
  ];

  for (const flow of flows) {
    mdLines.push(`### ${flow.competitor} — ${flow.label}`, '');
    mdLines.push('| Step | State | Screenshot | Caption |');
    mdLines.push('|------|-------|------------|---------|');
    flow.steps.forEach((step, i) => {
      mdLines.push(
        `| ${i + 1} | ${step.state} | ![${step.state}](${step.path}) | ${step.caption} |`
      );
    });
    mdLines.push('');
  }

  const jsonPath = path.join(runDir, `${baseName}.json`);
  const mdPath = path.join(runDir, `${baseName}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
  fs.writeFileSync(mdPath, `${mdLines.join('\n')}\n`);

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        jsonPath: path.relative(repoRoot, jsonPath),
        mdPath: path.relative(repoRoot, mdPath),
        nextStep: cmd('competitor-presentation', `--data ${path.relative(repoRoot, jsonPath)}`),
      },
      null,
      2
    )
  );
}

main();
