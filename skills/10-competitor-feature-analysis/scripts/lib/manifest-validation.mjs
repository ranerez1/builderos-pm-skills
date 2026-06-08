import fs from 'node:fs';
import path from 'node:path';
import { isStarterFlow, loadFlowFile } from './flow-io.mjs';
import { discoverSessionPath } from './paths.mjs';

/** Detect pipeline bypass / incomplete capture artifacts. */
export function validatePipelineIntegrity(repoRoot, { manifest, runDir }) {
  const warnings = [];
  const featureSlug = manifest.featureSlug;
  const shotsDir = path.join(runDir, 'screenshots');

  for (const entry of manifest.competitors || []) {
    const cachePath = path.join(repoRoot, 'Knowledge/competitor-flows', featureSlug, `${entry.slug}.json`);
    if (!fs.existsSync(cachePath)) {
      if (entry.needsDiscovery) warnings.push(`${entry.slug}: flow cache missing`);
      continue;
    }

    let flow;
    try {
      flow = loadFlowFile(cachePath);
    } catch {
      warnings.push(`${entry.slug}: flow cache unreadable`);
      continue;
    }

    const sessionPath = discoverSessionPath(repoRoot, `${entry.slug}-${featureSlug}`);
    const flowMtime = fs.statSync(cachePath).mtimeMs;
    const sessionExists = fs.existsSync(sessionPath);
    if (!sessionExists && !isStarterFlow(flow) && entry.needsDiscovery) {
      warnings.push(`${entry.slug}: flow saved without active discover session (possible hand-edit)`);
    }
    if (sessionExists) {
      const sessionMtime = fs.statSync(sessionPath).mtimeMs;
      if (flowMtime > sessionMtime + 5000) {
        warnings.push(`${entry.slug}: flow cache newer than discover session`);
      }
    }

    for (const screen of flow.screens || []) {
      const hasActions = screen.actions?.length > 0;
      const urlDiffers = screen.url && screen.url !== flow.startUrl;
      if (!hasActions && urlDiffers) {
        warnings.push(
          `${entry.slug}/${screen.state}: url set without actions — prefer click-nav for portable replay`
        );
      }

      const canonical = path.join(shotsDir, `${entry.slug}-${screen.state}.png`);
      const probe = path.join(shotsDir, `${entry.slug}-${screen.state}-probe.png`);
      if (fs.existsSync(probe) && !fs.existsSync(canonical)) {
        warnings.push(`${entry.slug}/${screen.state}: probe PNG only — run save-flow or replay`);
      }
    }

    if (entry.needsDiscovery && entry.captures?.length > 0 && isStarterFlow(flow)) {
      warnings.push(`${entry.slug}: captures exist but flow is still starter-only`);
    }
  }

  const reportMd = fs
    .readdirSync(runDir)
    .find((f) => f.endsWith('.md') && f.includes('comparison'));
  if (reportMd && manifest.competitors?.some((c) => c.needsDiscovery)) {
    warnings.push('comparison report exists while discovery still required — partial pipeline');
  }

  return { warnings, ok: warnings.length === 0 };
}
