#!/usr/bin/env node
// Headless auto-walk capture (default for URL mode in 1.6.0+).
//
// No user input — launches a headless CloakBrowser, discovers section
// headings, scrolls to each, screenshots, and writes flow.json with
// heuristically-drafted action/expected/assertions. The user edits flow.json
// after the fact if they want tighter assertions; renderers re-run cleanly.
//
// Usage:
//   node scripts/capture-url-auto.mjs --url=<https://...> --feature=<slug>
//     [--env=<...>] [--goal="..."] [--headed] [--max-sections=N]
//     [--preconditions="line1|line2"]

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { launchPersistentContext } from './lib/browser.mjs';
import { withProfileLock } from './lib/profile-lock.mjs';
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
  findHeadings,
  scrollToHeading,
  collectContextAroundHeading,
  settleAfterScroll,
} from './lib/page-discovery.mjs';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [k, ...rest] = raw.slice(2).split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

function templateAction({ index, headingText, url }) {
  if (index === 1) return `Navigate to ${url} and wait for network idle (~1.5s after DOMContentLoaded)`;
  return `Scroll the '${headingText}' section to the top of the viewport`;
}

function templateExpected({ index, headingText }) {
  if (index === 1)
    return 'The page shell renders: top-level navigation, primary header, and the first content section. No layout shift after 1s. No console errors.';
  return `The '${headingText}' section is visible at the top of the viewport with its primary content rendered.`;
}

function templateAssertions({ index, headingText, ctx, pageTitle }) {
  const out = [];
  if (index === 1) {
    if (pageTitle) out.push(`Document title is '${pageTitle}'`);
    out.push('Primary navigation is visible');
    out.push('No console errors logged during the load');
  } else {
    out.push(`Heading '${headingText}' is visible`);
    if (ctx && ctx.count >= 2) {
      out.push(`At least ${ctx.count} visible ${ctx.noun} render within this section`);
    } else if (ctx && ctx.count === 1) {
      out.push(`At least one ${ctx.noun.replace(/s$/, '')} renders within this section`);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error('Missing --url=<https://...>');
    process.exit(2);
  }
  if (!args.feature) {
    console.error('Missing --feature=<slug>');
    process.exit(2);
  }
  const maxSections = args['max-sections'] ? parseInt(args['max-sections'], 10) : 8;

  const repoRoot = findRepoRoot();
  const outDir = ensureOutputDir(defaultOutputDir(repoRoot, args.feature));
  const flowPath = path.join(outDir, 'flow.json');
  const screenshotsDir = path.join(outDir, 'screenshots');

  const preconditions = args.preconditions
    ? String(args.preconditions).split('|').map((s) => s.trim()).filter(Boolean)
    : [
        'Test runs on a desktop viewport of 1440×700',
        'Network access to the target URL',
      ];

  const flow = emptyFlow({
    feature: args.feature,
    url: args.url,
    env: args.env || 'staging',
    goal:
      args.goal ||
      `The ${args.feature} page renders all core sections correctly and key interactive elements are visible on first load`,
    preconditions,
    capturedVia: 'url',
  });
  writeFlow(flowPath, flow);

  const profilePath = path.join(os.homedir(), '.cache', 'builderos-validation-storyboard', slugify(args.feature));
  fs.mkdirSync(profilePath, { recursive: true });

  await withProfileLock(
    profilePath,
    async () => {
      const context = await launchPersistentContext({
        userDataDir: profilePath,
        headless: !args.headed,
        viewport: { width: 1440, height: 700 },
      });
      const page = context.pages()[0] || (await context.newPage());

      try {
        console.log(`Navigating ${args.url} (headless=${!args.headed}) ...`);
        await page.goto(args.url, { waitUntil: 'networkidle', timeout: 90_000 });
        await page.waitForTimeout(1500);

        const pageTitle = await page.title();

        // Step 01 — initial load (always).
        await page.evaluate(() => window.scrollTo(0, 0));
        await settleAfterScroll(page);
        const firstScreenshotRel = path.join('screenshots', '01-initial-load.png');
        await page.screenshot({ path: path.join(outDir, firstScreenshotRel), fullPage: false });
        appendStep(
          flow,
          makeStep({
            index: 1,
            label: 'Initial page load',
            action: templateAction({ index: 1, url: args.url }),
            expected: templateExpected({ index: 1 }),
            screenshot: firstScreenshotRel,
            assertions: templateAssertions({ index: 1, pageTitle }),
          }),
        );
        writeFlow(flowPath, flow);
        console.log(`  ✓ 01-initial-load.png`);

        // Discover section headings.
        const headings = await findHeadings(page, { max: maxSections });
        console.log(`Discovered ${headings.length} section heading(s) ${headings.length ? '' : '— skipping section walk.'}`);

        // Walk sections.
        let index = 2;
        for (const h of headings) {
          const achieved = await scrollToHeading(page, h.text);
          if (achieved < 0) continue;
          await settleAfterScroll(page);

          const ctx = await collectContextAroundHeading(page, h.text);

          const padded = String(index).padStart(2, '0');
          const slug = slugify(h.text) || `section-${padded}`;
          const screenshotRel = path.join('screenshots', `${padded}-${slug}.png`);
          await page.screenshot({ path: path.join(outDir, screenshotRel), fullPage: false });

          appendStep(
            flow,
            makeStep({
              index,
              label: h.text,
              action: templateAction({ index, headingText: h.text, url: args.url }),
              expected: templateExpected({ index, headingText: h.text }),
              screenshot: screenshotRel,
              assertions: templateAssertions({ index, headingText: h.text, ctx }),
            }),
          );
          writeFlow(flowPath, flow);
          console.log(`  ✓ ${padded}-${slug}.png  (heading at ${h.absTop.toFixed(0)}px, scrolled to ${achieved}px, ${ctx.count} ${ctx.noun})`);
          index += 1;
        }

        if (headings.length === 0) {
          console.log(
            '\nNo section headings discovered. Only the initial-load step was captured.',
          );
          console.log(
            'Re-run with --interactive to capture a custom flow by hand.',
          );
        }
      } finally {
        await context.close();
      }
    },
    { sessionId: `capture-url-auto-${process.pid}` },
  );

  console.log(`\nDone. ${flow.steps.length} step(s) captured.`);
  console.log(`flow.json: ${flowPath}`);
  console.log(`screenshots: ${screenshotsDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
