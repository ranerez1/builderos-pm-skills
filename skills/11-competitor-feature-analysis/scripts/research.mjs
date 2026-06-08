#!/usr/bin/env node
/**
 * Orchestrator: setup check, flow cache detection, replay, capture manifest.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  findRepoRoot,
  defaultRunDir,
  competitorsPath,
  parseArgs,
  slugify,
  todayISO,
  flowCachePath,
  skillRoot,
  ensureDir,
  cmd,
} from './lib/paths.mjs';
import { loadCompetitors, validateCompetitorsConfig, getCachedFeatureUrl } from './lib/competitors.mjs';
import {
  scoreCapabilityPatterns,
  loadCapabilityPattern,
  listCapabilityPatterns,
} from './lib/patterns.mjs';
import { flowCacheExists, starterFlowFromUrl, loadFlowFile, isStarterFlow } from './lib/flow-io.mjs';
import { ensureCloakBrowser, profileHasData, MIN_CLOAKBROWSER_VERSION } from './lib/setup.mjs';
import { profilesDir } from './lib/paths.mjs';
import { probeAuth } from './lib/auth.mjs';
import { validatePipelineIntegrity } from './lib/manifest-validation.mjs';

const SCRIPTS = path.join(skillRoot(), 'scripts');

const NAVIGATION_GUIDANCE = [
  'Prefer click/role locators for portable replay across accounts.',
  'Use goto for SPA route changes when clicks fail; record via capture-screen --url.',
  'Use hover before snapshot when edit pencils or row menus are hidden.',
  'Capture optional plan-gate screen when create is blocked by account limits.',
  'Capture empty-state when no seed data exists for detail views.',
];

function printHelp() {
  console.log(`Usage: competitor-research [options]

Options:
  --feature <name>        Feature to research (required)
  --competitors <slugs>   Comma-separated slugs (default: all from competitors.md)
  --pattern <id>          Capability pattern override
  --run-dir <path>        Output run folder
  --discover-only         Emit discover instructions only (no replay)
  --replay-only           Skip discover hints; replay cached flows only
  --force-discover        Treat all competitors as needing discovery
  --help

Exit codes:
  0  All replays succeeded — proceed to analysis
  1  Replay or setup failed
  2  Auth required
  3  Discovery required

Example:
  ${cmd('competitor-research', '--feature "add task"')}
`);
}

function runNodeScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [path.join(SCRIPTS, script), ...scriptArgs], {
    encoding: 'utf8',
    cwd: findRepoRoot(),
  });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

function resolveFeatureUrl(config, slug, feature, cachePath) {
  return (
    getCachedFeatureUrl(config.featureScreens, slug, feature) ||
    (cachePath && fs.existsSync(cachePath) ? loadFlowFile(cachePath).startUrl : null) ||
    config.competitors[slug].loginUrl
  );
}

function flowNeedsDiscovery(repoRoot, featureSlug, slug, forceDiscover) {
  if (forceDiscover) return true;
  const cachePath = flowCachePath(repoRoot, featureSlug, slug);
  if (!fs.existsSync(cachePath)) return true;
  try {
    return isStarterFlow(loadFlowFile(cachePath));
  } catch {
    return true;
  }
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const feature = args.feature;
  if (!feature) {
    printHelp();
    process.exit(1);
  }

  const repoRoot = findRepoRoot();
  const featureSlug = slugify(feature);
  const date = todayISO();
  const runDir = args['run-dir']
    ? path.isAbsolute(args['run-dir'])
      ? args['run-dir']
      : path.join(repoRoot, args['run-dir'])
    : defaultRunDir(repoRoot, feature, date);

  ensureDir(runDir);
  ensureDir(path.join(runDir, 'screenshots'));

  let binary;
  try {
    binary = await ensureCloakBrowser({ download: false });
  } catch (e) {
    console.log(JSON.stringify({ status: 'error', code: 'setup_required', message: e.message }, null, 2));
    process.exit(1);
  }

  const config = loadCompetitors(competitorsPath(repoRoot));
  validateCompetitorsConfig(config);

  const patternScoring = scoreCapabilityPatterns(feature);
  const pattern = args.pattern
    ? loadCapabilityPattern(args.pattern)
    : loadCapabilityPattern(patternScoring.suggestedPattern);

  let competitorSlugs = Object.keys(config.competitors);
  if (args.competitors) {
    competitorSlugs = args.competitors.split(',').map((s) => s.trim());
  }

  const authResults = {};
  const needsLogin = [];
  for (const slug of competitorSlugs) {
    if (!profileHasData(profilesDir(repoRoot, slug))) {
      needsLogin.push(slug);
      continue;
    }
    const cachePath = flowCachePath(repoRoot, featureSlug, slug);
    const probeUrl = resolveFeatureUrl(config, slug, feature, cachePath);
    const probe = await probeAuth(repoRoot, slug, probeUrl);
    authResults[slug] = probe;
    if (!probe.authenticated) needsLogin.push(slug);
  }

  if (needsLogin.length) {
    console.log(
      JSON.stringify(
        {
          status: 'auth_required',
          feature,
          featureSlug,
          runDir: path.relative(repoRoot, runDir),
          needsLogin,
          authResults,
          nextSteps: needsLogin.map((slug) =>
            cmd(
              'competitor-login',
              `--competitor ${slug} --verify "${resolveFeatureUrl(config, slug, feature, flowCachePath(repoRoot, featureSlug, slug))}"`
            )
          ),
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const discoverOnly = Boolean(args['discover-only']);
  const replayOnly = Boolean(args['replay-only']);
  const forceDiscover = Boolean(args['force-discover']);

  const manifest = {
    status: 'ok',
    feature,
    featureSlug,
    runDir: path.relative(repoRoot, runDir),
    capabilityPattern: pattern.id || args.pattern,
    patternConfidence: patternScoring.lowConfidence ? 'low' : 'high',
    suggestedPattern: patternScoring.suggestedPattern,
    alternatePattern: patternScoring.alternatePattern,
    expectedStates: pattern.expectedStates || [],
    optionalStates: ['plan-gate', 'empty-state'],
    discoveryHints: pattern.discoveryHints || [],
    forbiddenActions: pattern.forbiddenActions || [],
    navigationGuidance: NAVIGATION_GUIDANCE,
    availablePatterns: listCapabilityPatterns(),
    minCloakbrowserVersion: MIN_CLOAKBROWSER_VERSION,
    binary: { platform: binary.platform, installed: binary.installed },
    competitors: [],
    discoverInstructions: [],
  };

  if (patternScoring.lowConfidence && !args.pattern) {
    manifest.patternRecommendation = `Re-run with --pattern ${patternScoring.suggestedPattern}` +
      (patternScoring.alternatePattern ? ` or --pattern ${patternScoring.alternatePattern}` : '');
  }

  let anyDiscover = false;
  let anyReplayFailed = false;

  for (const slug of competitorSlugs) {
    const entry = {
      slug,
      flowCacheExists: flowCacheExists(repoRoot, featureSlug, slug),
      captures: [],
      needsDiscovery: false,
    };

    const cachePath = flowCachePath(repoRoot, featureSlug, slug);
    const needsDiscovery = flowNeedsDiscovery(repoRoot, featureSlug, slug, forceDiscover);
    const featureUrl = resolveFeatureUrl(config, slug, feature, cachePath);

    if (needsDiscovery && !replayOnly) {
      anyDiscover = true;
      entry.needsDiscovery = true;
      const sessionId = `${slug}-${featureSlug}`;
      const patternFlag = args.pattern ? ` --pattern ${args.pattern}` : '';

      manifest.discoverInstructions.push({
        competitor: slug,
        sessionId,
        startUrl: featureUrl,
        capabilityPattern: pattern.id,
        expectedStates: pattern.expectedStates || [],
        discoveryHints: pattern.discoveryHints || [],
        forbiddenActions: pattern.forbiddenActions || [],
        navigationGuidance: NAVIGATION_GUIDANCE,
        steps: [
          cmd('competitor-discover', `--cmd launch --competitor ${slug} --feature "${feature}" --url "${featureUrl}"${patternFlag}`),
          cmd('competitor-discover', `--cmd snapshot --session-id ${sessionId} --scroll`),
          `# Navigate: click (modals), goto --url (SPA routes), hover (row menus)`,
          cmd('competitor-discover', `--cmd capture-screen --session-id ${sessionId} --state main --label "Main view" --run-dir ${path.relative(repoRoot, runDir)}`),
          `# Optional: --url for deep links; --optional --condition plan-gated for upsell branches`,
          cmd('competitor-discover', `--cmd save-flow --session-id ${sessionId} --run-dir ${path.relative(repoRoot, runDir)}`),
          cmd('competitor-discover', `--cmd close --session-id ${sessionId}`),
        ],
      });

      if (!entry.flowCacheExists && !discoverOnly) {
        const starter = starterFlowFromUrl({
          feature,
          featureSlug,
          competitor: slug,
          startUrl: featureUrl,
          capabilityPattern: pattern.id,
        });
        ensureDir(path.dirname(cachePath));
        fs.writeFileSync(cachePath, `${JSON.stringify(starter, null, 2)}\n`);
        entry.flowCacheExists = true;
        entry.starterFlowWritten = true;
      }
    }

    const skipReplay = entry.starterFlowWritten || (needsDiscovery && !replayOnly);
    if (!skipReplay && entry.flowCacheExists && fs.existsSync(cachePath)) {
      const flowRel = path.relative(repoRoot, cachePath);
      const result = runNodeScript('flow.mjs', [
        '--competitor',
        slug,
        '--flow',
        flowRel,
        '--run-dir',
        path.relative(repoRoot, runDir),
      ]);

      if (result.status === 2) {
        entry.replayError = 'auth_required';
        entry.stderr = result.stderr;
        anyReplayFailed = true;
      } else if (result.status !== 0) {
        entry.replayError = 'replay_failed';
        entry.stderr = result.stderr || result.stdout;
        anyReplayFailed = true;
      } else {
        try {
          const parsed = JSON.parse(result.stdout);
          entry.captures = parsed.captures || [];
        } catch {
          entry.replayError = 'parse_failed';
          entry.stdout = result.stdout;
          anyReplayFailed = true;
        }
      }
    }

    manifest.competitors.push(entry);
  }

  const integrity = validatePipelineIntegrity(repoRoot, { manifest, runDir });
  manifest.pipelineWarnings = integrity.warnings;

  const manifestPath = path.join(runDir, 'capture-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  let exitCode = 0;
  if (anyDiscover && !discoverOnly) exitCode = 3;
  else if (anyReplayFailed) exitCode = 1;
  else if (discoverOnly && anyDiscover) exitCode = 3;

  manifest.status = exitCode === 0 ? 'ready_for_analysis' : exitCode === 3 ? 'discovery_required' : 'replay_failed';

  console.log(
    JSON.stringify({ ...manifest, manifestPath: path.relative(repoRoot, manifestPath), exitCode }, null, 2)
  );
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'error', message: err.message }, null, 2));
  process.exit(1);
});
