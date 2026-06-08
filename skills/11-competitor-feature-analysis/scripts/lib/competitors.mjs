import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, skillRoot } from './paths.mjs';

const FILL_PATTERN = /\[FILL\]/i;

function parseTableRows(lines) {
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      if (inTable && rows.length > 0) break;
      continue;
    }
    if (/^\|\s*[-:]+/.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable && rows.length === 0) {
      inTable = true;
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function parseBulletSection(content, heading) {
  const re = new RegExp(`## ${heading}[\\s\\S]*?(?=\\n## |$)`, 'i');
  const match = content.match(re);
  if (!match) return {};
  const section = match[0];
  const result = {};
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*-\s*\*\*([^*]+)\*\*:\s*(.+)$/);
    if (m) result[m[1].trim()] = m[2].trim();
  }
  return result;
}

/** Copy the plugin template into the workspace when competitors.md is missing. */
export function scaffoldCompetitorsIfMissing(repoRoot) {
  const filePath = path.join(repoRoot, 'Knowledge', 'competitors.md');
  if (fs.existsSync(filePath)) return null;

  const templatePath = path.join(
    skillRoot(),
    '..',
    '..',
    'templates',
    'Knowledge',
    'competitors.md.template'
  );
  if (!fs.existsSync(templatePath)) return null;

  ensureDir(path.join(repoRoot, 'Knowledge'));
  fs.copyFileSync(templatePath, filePath);
  return filePath;
}

export function loadCompetitors(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Fill Knowledge/competitors.md before capture.`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (FILL_PATTERN.test(content)) {
    throw new Error('Knowledge/competitors.md contains [FILL] placeholders. Complete it before capture.');
  }

  const yourProduct = parseBulletSection(content, 'Your product');
  const competitorsSection = content.match(/## Competitors[\s\S]*?(?=\n## |$)/i);
  const featureSection = content.match(/## Feature screens[\s\S]*$/i);

  const competitorRows = competitorsSection
    ? parseTableRows(competitorsSection[0].split('\n').slice(1))
    : [];

  const competitors = {};
  for (const [slug, name, loginUrl, notes] of competitorRows) {
    if (!slug || /^slug$/i.test(slug) || /^competitor slug$/i.test(slug)) continue;
    competitors[slug] = { slug, name, loginUrl, notes: notes || '' };
  }

  const featureRows = featureSection
    ? parseTableRows(featureSection[0].split('\n').slice(1))
    : [];

  const featureScreens = [];
  for (const [competitorSlug, feature, cachedUrl, lastVerified] of featureRows) {
    if (!competitorSlug || !feature || /^competitor slug$/i.test(competitorSlug)) continue;
    featureScreens.push({
      competitorSlug,
      feature: feature.toLowerCase(),
      cachedUrl: cachedUrl || '',
      lastVerified: lastVerified || '',
    });
  }

  return { yourProduct, competitors, featureScreens, raw: content };
}

export function getCachedFeatureUrl(featureScreens, competitorSlug, featureName) {
  const normalized = featureName.toLowerCase().trim();
  const hit = featureScreens.find(
    (r) => r.competitorSlug === competitorSlug && r.feature === normalized && r.cachedUrl
  );
  return hit?.cachedUrl || null;
}

/** Upsert a row in the Feature screens table after save-flow. */
export function upsertFeatureScreen(filePath, { competitorSlug, feature, cachedUrl, lastVerified }) {
  const content = fs.readFileSync(filePath, 'utf8');
  const normalized = feature.toLowerCase().trim();
  const sectionRe = /## Feature screens[\s\S]*$/i;
  const match = content.match(sectionRe);
  if (!match) return content;

  const lines = match[0].split('\n');
  const headerIdx = lines.findIndex((l) => l.trim().startsWith('|'));
  const sepIdx = lines.findIndex((l) => /^\|\s*[-:]+/.test(l));
  if (headerIdx < 0) return content;

  const dataStart = sepIdx >= 0 ? sepIdx + 1 : headerIdx + 1;
  const dataRows = [];
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) break;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    const isMatch =
      cells[0] === competitorSlug && cells[1].toLowerCase() === normalized;
    if (isMatch) {
      dataRows.push(`| ${competitorSlug} | ${feature} | ${cachedUrl} | ${lastVerified} |`);
    } else {
      dataRows.push(line);
    }
  }

  const hadRow = dataRows.some((r) => {
    const cells = r.split('|').slice(1, -1).map((c) => c.trim());
    return cells[0] === competitorSlug && cells[1].toLowerCase() === normalized;
  });
  if (!hadRow) {
    dataRows.push(`| ${competitorSlug} | ${feature} | ${cachedUrl} | ${lastVerified} |`);
  }

  const newSection = [...lines.slice(0, dataStart), ...dataRows].join('\n');
  return content.replace(sectionRe, newSection);
}

export function validateCompetitorsConfig(config) {
  const errors = [];
  if (!config.yourProduct.Slug || !config.yourProduct.Name) {
    errors.push('Your product Slug and Name are required.');
  }
  const slugs = Object.keys(config.competitors);
  if (slugs.length === 0) {
    errors.push('At least one competitor row is required.');
  }
  for (const slug of slugs) {
    const c = config.competitors[slug];
    if (!c.loginUrl) errors.push(`Competitor "${slug}" is missing Login URL.`);
  }
  if (errors.length) {
    throw new Error(errors.join(' '));
  }
}
