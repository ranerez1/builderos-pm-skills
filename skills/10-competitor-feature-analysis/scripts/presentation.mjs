#!/usr/bin/env node
/**
 * Generate a self-contained editorial-style HTML report from comparison or
 * gap-analysis JSON. Two report types share one theme:
 *   - comparison: hero + key insights + comparison table + storyboard flows
 *   - gap-analysis: hero + key insights + top priorities + value-ranked table
 */
import fs from 'node:fs';
import path from 'node:path';
import { findRepoRoot, parseArgs } from './lib/paths.mjs';

/** Stable accent palette assigned to competitors by index. */
const ACCENTS = ['#6366f1', '#0ea5e9', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];

/** Canonical order states appear in a flow storyboard. */
const STATE_ORDER = ['main', 'empty', 'create', 'edit', 'error'];

const FONT_STACK = 'Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

const CSS = `
  :root {
    --bg: #f8fafc; --paper: #ffffff; --ink: #0f172a; --body: #475569;
    --muted: #94a3b8; --line: #e2e8f0; --line-soft: #f1f5f9;
    --accent: #10b981; --accent-strong: #059669; --accent-soft: #ecfdf5;
    --good: #10b981; --warn: #f59e0b; --bad: #ef4444; --info: #2563eb;
    --shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06);
    --radius: 14px;
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: ${FONT_STACK};
    background: var(--bg); color: var(--body); margin: 0;
    line-height: 1.6; font-size: 16px;
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 1.5rem 5rem; }
  .sans { font-family: ${FONT_STACK}; }

  /* ---- Hero ---- */
  .hero { padding: 3.5rem 0 2.25rem; border-bottom: 1px solid var(--line); }
  .eyebrow {
    text-transform: uppercase; letter-spacing: .16em; font-size: .72rem; font-weight: 600;
    color: var(--accent-strong); margin: 0 0 1rem; display: inline-flex; align-items: center; gap: .5rem;
  }
  .eyebrow::before { content: ""; width: .7rem; height: .7rem; border-radius: 3px; background: var(--accent); }
  .hero h1 {
    font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1.08; letter-spacing: -.025em;
    color: var(--ink); font-weight: 700; margin: 0 0 1.1rem; max-width: 20ch;
  }
  .hero h1 em { font-style: normal; color: var(--accent-strong); }
  .deck { font-size: 1.15rem; color: var(--body); max-width: 62ch; margin: 0 0 1.7rem; font-weight: 400; }
  .legend { display: flex; flex-wrap: wrap; gap: .55rem; align-items: center; }
  .chip {
    font-size: .82rem; font-weight: 500; color: var(--ink);
    display: inline-flex; align-items: center; gap: .45rem; padding: .35rem .8rem;
    border: 1px solid var(--line); border-radius: 999px; background: var(--paper); box-shadow: var(--shadow);
  }
  .chip .dot { width: .6rem; height: .6rem; border-radius: 50%; }
  .meta { color: var(--muted); font-size: .82rem; }

  /* ---- Section headers ---- */
  section { margin-top: 3.25rem; }
  .kicker {
    text-transform: uppercase; letter-spacing: .12em; font-size: .7rem; font-weight: 600;
    color: var(--muted); display: flex; align-items: center; gap: .8rem; margin-bottom: 1.1rem;
  }
  .kicker::after { content: ""; flex: 1; height: 1px; background: var(--line); }
  h2.title { font-size: 1.65rem; letter-spacing: -.02em; color: var(--ink); margin: 0 0 1.3rem; font-weight: 600; }

  /* ---- Key insights ---- */
  .insights { display: grid; gap: 1rem; }
  .insight {
    display: grid; grid-template-columns: 3rem 1fr; gap: 1rem; align-items: start;
    background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius);
    padding: 1.2rem 1.4rem; box-shadow: var(--shadow);
  }
  .insight .num {
    font-size: 1.6rem; font-weight: 700; color: var(--accent); line-height: 1;
    font-variant-numeric: tabular-nums; padding-top: .15rem;
  }
  .insight h3 { margin: 0 0 .3rem; font-size: 1.12rem; color: var(--ink); font-weight: 600; }
  .insight p { margin: 0; font-size: .95rem; }
  .tag {
    font-size: .66rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
    padding: .14rem .5rem; border-radius: 6px; color: #fff; margin-left: .5rem; vertical-align: middle;
  }

  /* ---- Comparison table ---- */
  .table-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); background: var(--paper); }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; }
  thead th { position: sticky; top: 0; z-index: 1; }
  th, td { padding: .8rem 1rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line-soft); }
  th { background: var(--ink); color: #fff; font-weight: 600; font-size: .8rem; letter-spacing: .01em; }
  th.cap-col { background: #1e293b; }
  th .th-dot { display: inline-block; width: .55rem; height: .55rem; border-radius: 50%; margin-right: .45rem; vertical-align: middle; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #f1f5f9; }
  tbody tr:last-child td { border-bottom: none; }
  td.cap { font-weight: 600; color: var(--ink); }
  .pill {
    display: inline-block; font-size: .72rem; font-weight: 600; padding: .14rem .55rem;
    border-radius: 999px; margin-right: .4rem; white-space: nowrap; vertical-align: baseline;
  }
  .pill-yes { background: var(--accent-soft); color: var(--accent-strong); }
  .pill-no { background: #f1f5f9; color: #64748b; }
  .pill-partial { background: #fef3c7; color: #b45309; }
  .pill-need { background: #f8fafc; color: #64748b; border: 1px dashed #cbd5e1; }
  .cell-text { color: var(--body); }
  .cell-ref { color: var(--accent-strong); text-decoration: none; font-size: .85em; white-space: nowrap; }
  .cell-ref:hover { text-decoration: underline; }

  /* ---- Flows / storyboard ---- */
  .flow { margin-bottom: 2.2rem; }
  .flow-head { display: flex; align-items: center; gap: .7rem; margin-bottom: 1rem; }
  .flow-head .dot { width: .7rem; height: .7rem; border-radius: 50%; }
  .flow-head h3 { margin: 0; font-size: 1.2rem; color: var(--ink); font-weight: 600; }
  .flow-head .label { font-size: .85rem; color: var(--muted); }
  .steps { display: flex; gap: 0; overflow-x: auto; padding-bottom: .6rem; align-items: stretch; }
  .step { flex: 0 0 300px; max-width: 300px; }
  .step-card {
    background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius);
    overflow: hidden; box-shadow: var(--shadow); height: 100%; display: flex; flex-direction: column;
  }
  .step-card a.shot { display: block; line-height: 0; border-bottom: 1px solid var(--line-soft); }
  .step-card img { width: 100%; display: block; }
  .step-meta { padding: .8rem .9rem 1rem; }
  .step-meta .badge {
    display: inline-flex; align-items: center; gap: .4rem; font-size: .66rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: .04em; color: #fff; padding: .16rem .55rem;
    border-radius: 6px; margin-bottom: .5rem;
  }
  .step-meta .stepno { font-variant-numeric: tabular-nums; opacity: .85; }
  .step-meta p { margin: 0; font-size: .85rem; color: var(--body); }
  .step-meta a.src { font-size: .76rem; color: var(--info); word-break: break-all; }
  .connector { flex: 0 0 2.4rem; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
  .connector svg { width: 1.5rem; height: 1.5rem; }

  /* CSS-only lightbox */
  .lightbox { position: fixed; inset: 0; background: rgba(15,23,42,.88); display: none; z-index: 50; padding: 2rem; cursor: zoom-out; }
  .lightbox:target { display: flex; align-items: center; justify-content: center; }
  .lightbox img { max-width: 100%; max-height: 92vh; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,.45); }

  /* ---- Notes / cards ---- */
  .notes { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.2rem; }
  .note-card { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 1.3rem 1.5rem; box-shadow: var(--shadow); }
  .note-card h3 { margin: 0 0 .8rem; font-size: 1.1rem; color: var(--ink); font-weight: 600; display: flex; align-items: center; gap: .5rem; }
  .note-card h3 .dot { width: .65rem; height: .65rem; border-radius: 50%; }
  .note-card ul { margin: 0; padding-left: 1.1rem; }
  .note-card li { margin-bottom: .45rem; font-size: .92rem; }
  .note-card li::marker { color: var(--accent); }

  /* ---- Gap analysis priorities ---- */
  .prio { display: grid; gap: 1rem; }
  .prio-card { background: var(--paper); border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: var(--radius); padding: 1.2rem 1.4rem; box-shadow: var(--shadow); }
  .prio-card h3 { margin: 0 0 .5rem; font-size: 1.1rem; color: var(--ink); font-weight: 600; }
  .tier { font-size: .72rem; font-weight: 600; padding: .12rem .5rem; border-radius: 6px; }
  .tier-P0 { background: #fee2e2; color: #b91c1c; }
  .tier-P1 { background: #fef3c7; color: #b45309; }
  .tier-P2 { background: #dbeafe; color: #1d4ed8; }
  .tier-P3 { background: #f1f5f9; color: #64748b; }
  .status-Shipped { color: var(--accent-strong); font-weight: 600; }
  .status-Partial { color: #b45309; font-weight: 600; }
  .status-Gap { color: #b91c1c; font-weight: 600; }
  .status-Deferred, .status-Not { color: #64748b; }

  .dq { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 1.2rem 1.5rem; box-shadow: var(--shadow); font-size: .9rem; }
  .dq ul { margin: 0; padding-left: 1.2rem; }
  .dq li { margin-bottom: .4rem; color: var(--body); }
  .docs a, .src { color: var(--info); }
  .empty { color: var(--muted); font-size: .9rem; }
  footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--line); font-size: .78rem; color: var(--muted); }
`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveImagePath(dataDir, imgPath, runDir, repoRoot) {
  const candidates = [
    path.join(dataDir, imgPath),
    path.join(repoRoot, runDir || '', imgPath),
    path.join(repoRoot, imgPath),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return path.relative(dataDir, c);
  }
  return imgPath;
}

/** Map competitor slug -> stable accent color by order of appearance. */
function accentMap(competitors) {
  const map = {};
  (competitors || []).forEach((c, i) => {
    map[c] = ACCENTS[i % ACCENTS.length];
  });
  return map;
}

/** Render cell text with optional markdown links [label](url). */
function renderCellText(text) {
  if (!text) return '';
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(escapeHtml(text.slice(last, m.index)));
    parts.push(`<a class="cell-ref" href="${escapeHtml(m[2])}" target="_blank" rel="noopener">${escapeHtml(m[1])}</a>`);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(escapeHtml(text.slice(last)));
  return parts.join('');
}

/** Turn a capability cell into a leading pill + remaining descriptive text. */
function cellBadge(value) {
  const raw = value == null || value === '' ? '—' : String(value);
  if (raw === '—') return '<span class="empty">—</span>';

  // [NEED: ...] anywhere -> needs-verify pill, keep the rest as context.
  const needMatch = raw.match(/\[NEED[^\]]*\]/i);
  if (needMatch) {
    const rest = raw.replace(needMatch[0], '').replace(/^[\s—-]+|[\s—-]+$/g, '');
    return `<span class="pill pill-need">needs verify</span>${rest ? `<span class="cell-text">${renderCellText(rest)}</span>` : ''}`;
  }

  const firstWord = raw.split(/[\s—-]/)[0];
  let cls = null;
  let label = null;
  if (/^yes$/i.test(firstWord)) { cls = 'pill-yes'; label = 'Yes'; }
  else if (/^(no|none)$/i.test(firstWord)) { cls = 'pill-no'; label = 'No'; }
  else if (/^not$/i.test(firstWord)) { cls = 'pill-no'; label = 'No'; }
  else if (/^partial$/i.test(firstWord)) { cls = 'pill-partial'; label = 'Partial'; }
  else if (/^(pro|business|premium|paid)$/i.test(firstWord)) { cls = 'pill-partial'; label = firstWord; }

  if (cls) {
    const rest = raw.slice(firstWord.length).replace(/^[\s—-]+/, '');
    return `<span class="pill ${cls}">${escapeHtml(label)}</span>${rest ? `<span class="cell-text">${renderCellText(rest)}</span>` : ''}`;
  }
  return `<span class="cell-text">${renderCellText(raw)}</span>`;
}

function legendChips(competitors, accents) {
  return (competitors || [])
    .map(
      (c) =>
        `<span class="chip"><span class="dot" style="background:${accents[c]}"></span>${escapeHtml(c)}</span>`
    )
    .join('');
}

function keyInsightsSection(data, accents) {
  const items = data.keyInsights || [];
  if (!items.length) return '';
  const rows = items
    .map((it, i) => {
      const tag = it.competitor
        ? `<span class="tag" style="background:${accents[it.competitor] || 'var(--ink)'}">${escapeHtml(it.competitor)}</span>`
        : '';
      const detail = it.detail ? `<p>${escapeHtml(it.detail)}</p>` : '';
      return `<div class="insight"><div class="num">${String(i + 1).padStart(2, '0')}</div><div><h3>${escapeHtml(it.title || '')}${tag}</h3>${detail}</div></div>`;
    })
    .join('');
  return `<section><div class="kicker">Key insights</div><div class="insights">${rows}</div></section>`;
}

const ARROW = '<div class="connector"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>';

/**
 * Build per-competitor flows. Use explicit data.flows when present; otherwise
 * auto-group screenshots by competitor in canonical state order.
 */
function buildFlows(data) {
  if (Array.isArray(data.flows) && data.flows.length) {
    return data.flows.map((f) => ({
      competitor: f.competitor,
      label: f.label || '',
      steps: f.steps || [],
    }));
  }
  const byComp = new Map();
  for (const s of data.screenshots || []) {
    if (!byComp.has(s.competitor)) byComp.set(s.competitor, []);
    byComp.get(s.competitor).push(s);
  }
  const order = (st) => {
    const i = STATE_ORDER.indexOf(st);
    return i === -1 ? STATE_ORDER.length : i;
  };
  // Preserve competitor order from data.competitors when available.
  const comps = (data.competitors && data.competitors.length)
    ? data.competitors.filter((c) => byComp.has(c))
    : [...byComp.keys()];
  return comps.map((competitor) => ({
    competitor,
    label: '',
    steps: byComp.get(competitor).slice().sort((a, b) => order(a.state) - order(b.state)),
  }));
}

function flowsSection(data, dataDir, repoRoot, accents) {
  const flows = buildFlows(data).filter((f) => (f.steps || []).length);
  if (!flows.length) return '';
  let lightboxes = '';

  const blocks = flows
    .map((flow) => {
      const color = accents[flow.competitor] || 'var(--ink)';
      const stepEls = (flow.steps || [])
        .map((s, i) => {
          const rel = resolveImagePath(dataDir, s.path, data.runDir, repoRoot);
          const lbId = `lb-${escapeHtml(String(flow.competitor))}-${escapeHtml(String(s.state || i))}-${i}`.replace(/[^a-z0-9-]/gi, '');
          lightboxes += `<a href="#" class="lightbox" id="${lbId}"><img src="${escapeHtml(rel)}" alt="${escapeHtml(flow.competitor)} ${escapeHtml(s.state || '')}"></a>`;
          const caption = s.caption ? `<p>${escapeHtml(s.caption)}</p>` : '';
          const src = s.url ? `<br><a class="src" href="${escapeHtml(s.url)}">${escapeHtml(s.url)}</a>` : '';
          return `<div class="step"><div class="step-card"><a class="shot" href="#${lbId}"><img src="${escapeHtml(rel)}" alt="${escapeHtml(flow.competitor)} ${escapeHtml(s.state || '')}"></a><div class="step-meta"><span class="badge" style="background:${color}"><span class="stepno">${String(i + 1).padStart(2, '0')}</span> ${escapeHtml(s.state || 'step')}</span>${caption}${src}</div></div></div>`;
        })
        .join(ARROW);
      const label = flow.label ? `<span class="label">${escapeHtml(flow.label)}</span>` : '';
      return `<div class="flow"><div class="flow-head"><span class="dot" style="background:${color}"></span><h3>${escapeHtml(flow.competitor)}</h3>${label}</div><div class="steps">${stepEls}</div></div>`;
    })
    .join('');

  return `<section><div class="kicker">Competitor flows</div><h2 class="title">Step-by-step storyboards</h2>${blocks}</section>${lightboxes}`;
}

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${CSS}</style></head><body><div class="wrap">${body}</div></body></html>`;
}

function renderComparison(data, dataDir, repoRoot) {
  const competitors = data.competitors || [];
  const accents = accentMap(competitors);

  const deck = data.summary
    ? `<p class="deck">${escapeHtml(data.summary)}</p>`
    : data.scope
      ? `<p class="deck">${escapeHtml(data.scope)}</p>`
      : '';

  const hero = `<header class="hero">
    <p class="eyebrow">Competitor analysis</p>
    <h1>How <em>${escapeHtml(competitors.join(' & ') || 'competitors')}</em> handle ${escapeHtml(data.feature || 'this feature')}</h1>
    ${deck}
    <div class="legend">${legendChips(competitors, accents)}<span class="meta" style="margin-left:.4rem">${escapeHtml(data.date || '')}</span></div>
  </header>`;

  // Scope (only show as its own block if a distinct summary deck was used)
  const scopeSection = data.summary && data.scope
    ? `<section><div class="kicker">Scope</div><p>${escapeHtml(data.scope)}</p></section>`
    : '';

  const insights = keyInsightsSection(data, accents);

  // Comparison table
  const headerCells = ['<th class="cap-col">Capability</th>']
    .concat(competitors.map((c) => `<th><span class="th-dot" style="background:${accents[c]}"></span>${escapeHtml(c)}</th>`))
    .join('');
  const capRows = (data.capabilities || [])
    .map((row) => {
      const cells = [`<td class="cap">${escapeHtml(row.name)}</td>`]
        .concat(competitors.map((c) => `<td>${cellBadge(row[c])}</td>`))
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  const tableSection = `<section><div class="kicker">Capability comparison</div><h2 class="title">Feature-by-feature</h2><div class="table-scroll"><table><thead><tr>${headerCells}</tr></thead><tbody>${capRows || `<tr><td colspan="${competitors.length + 1}" class="empty">No capabilities</td></tr>`}</tbody></table></div></section>`;

  const flows = flowsSection(data, dataDir, repoRoot, accents);

  const notes = (data.notes || [])
    .map((n) => {
      const color = accents[n.competitor] || 'var(--ink)';
      return `<div class="note-card"><h3><span class="dot" style="background:${color}"></span>${escapeHtml(n.competitor)}</h3><ul>${(n.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul></div>`;
    })
    .join('');
  const notesSection = notes
    ? `<section><div class="kicker">Per-competitor notes</div><div class="notes">${notes}</div></section>`
    : '';

  const docs = (data.docs || [])
    .map(
      (d) =>
        `<tr><td class="cap">${escapeHtml(d.competitor)}</td><td>${escapeHtml(d.title)}</td><td><a href="${escapeHtml(d.url)}">${escapeHtml(d.url)}</a></td></tr>`
    )
    .join('');
  const docsSection = docs
    ? `<section class="docs"><div class="kicker">Supplemental docs</div><div class="table-scroll"><table><thead><tr><th class="cap-col">Competitor</th><th>Doc</th><th>URL</th></tr></thead><tbody>${docs}</tbody></table></div></section>`
    : '';

  const body = `${hero}${insights}${scopeSection}${tableSection}${flows}${notesSection}${docsSection}<footer>Generated by /10-competitor-feature-analysis · ${escapeHtml(data.date || '')}</footer>`;
  return page(`${data.feature} — Competitor comparison`, body);
}

function statusCell(cell) {
  if (!cell || typeof cell === 'string') {
    const status = cell || '—';
    const cls = typeof status === 'string' && status.match(/^\w+/) ? `status-${status.split(' ')[0]}` : '';
    return `<td class="${cls}">${escapeHtml(status)}</td>`;
  }
  const cls = `status-${cell.status || ''}`;
  const note = cell.note ? `<br><span class="meta">${escapeHtml(cell.note)}</span>` : '';
  return `<td class="${cls}">${escapeHtml(cell.status || '—')}${note}</td>`;
}

function renderGapAnalysis(data, dataDir, repoRoot) {
  const ownSlug = data.ownProduct?.slug || 'your-product';
  const ownName = data.ownProduct?.name || ownSlug;
  const competitorSlugs = new Set();
  for (const row of data.rows || []) {
    for (const key of Object.keys(row)) {
      if (!['capability', 'valueTier', 'gapSummary'].includes(key)) competitorSlugs.add(key);
    }
  }
  competitorSlugs.delete(ownSlug);
  const compList = [...competitorSlugs];
  const accents = accentMap([...compList, ownSlug]);

  const hero = `<header class="hero">
    <p class="eyebrow">Gap analysis</p>
    <h1>Where <em>${escapeHtml(ownName)}</em> stands on ${escapeHtml(data.feature || 'this feature')}</h1>
    ${data.summary ? `<p class="deck">${escapeHtml(data.summary)}</p>` : ''}
    <div class="legend">${legendChips([...compList, ownSlug], accents)}<span class="meta" style="margin-left:.4rem">${escapeHtml(data.date || '')}</span></div>
  </header>`;

  const insights = keyInsightsSection(data, accents);

  const topSix = (data.topSix || [])
    .map((t) => {
      const urls = (t.communityUrls || []).map((u) => `<li><a href="${escapeHtml(u)}">${escapeHtml(u)}</a></li>`).join('');
      return `<div class="prio-card"><h3>#${escapeHtml(String(t.rank))} ${escapeHtml(t.capability)} <span class="tier tier-${escapeHtml(t.valueTier)}">${escapeHtml(t.valueTier)}</span></h3>
<p>${escapeHtml(t.communitySignal || '')}</p>
${urls ? `<ul>${urls}</ul>` : ''}
<p><strong>Product difference:</strong> ${escapeHtml(t.productDifference || '')}</p></div>`;
    })
    .join('');
  const topSection = topSix ? `<section><div class="kicker">Top priorities</div><div class="prio">${topSix}</div></section>` : '';

  const headers = ['Capability', 'Tier', ...compList, ownName, 'Gap summary'];
  const headerCells = headers
    .map((h, i) => {
      if (i === 0) return `<th class="cap-col">${escapeHtml(h)}</th>`;
      const slug = i >= 2 && i < 2 + compList.length ? compList[i - 2] : i === 2 + compList.length ? ownSlug : null;
      const dot = slug ? `<span class="th-dot" style="background:${accents[slug]}"></span>` : '';
      return `<th>${dot}${escapeHtml(h)}</th>`;
    })
    .join('');
  const rows = (data.rows || [])
    .map((row) => {
      const tier = row.valueTier || '';
      const cells = [
        `<td class="cap">${escapeHtml(row.capability)}</td>`,
        `<td><span class="tier tier-${escapeHtml(tier)}">${escapeHtml(tier)}</span></td>`,
        ...compList.map((s) => statusCell(row[s])),
        statusCell(row[ownSlug]),
        `<td class="cell-text">${escapeHtml(row.gapSummary || '')}</td>`,
      ];
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');
  const tableSection = `<section><div class="kicker">Value-ranked comparison</div><h2 class="title">Capability gaps</h2><div class="table-scroll"><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div></section>`;

  const strengths = (data.ownProductStrengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const strengthsSection = `<section><div class="kicker">${escapeHtml(ownName)} strengths</div><div class="note-card"><ul>${strengths || '<li>None listed</li>'}</ul></div></section>`;

  const thumbs = (data.screenshots || [])
    .map((s) => {
      const rel = resolveImagePath(dataDir, s.path, data.runDir, repoRoot);
      return `<img src="${escapeHtml(rel)}" alt="${escapeHtml(s.competitor)}" style="max-width:180px;border-radius:8px;border:1px solid var(--line);box-shadow:var(--shadow)">`;
    })
    .join(' ');
  const thumbsSection = thumbs ? `<section><div class="kicker">Screenshot references</div><p>${thumbs}</p></section>` : '';

  const body = `${hero}${insights}${topSection}${tableSection}${strengthsSection}${thumbsSection}<footer>Generated by /10-competitor-feature-analysis · gap analysis · ${escapeHtml(data.date || '')}</footer>`;
  return page(`${data.feature} — Gap analysis`, body);
}

function printHelp() {
  console.log(`Usage: competitor-presentation [options]

Options:
  --data <path>     Path to comparison or gap-analysis JSON (required)
  --output <path>   Output HTML path (default: same dir as JSON, .html extension)
  --help            Show this help
`);
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const dataPath = args.data;
  if (!dataPath) {
    printHelp();
    process.exit(1);
  }

  const repoRoot = findRepoRoot();
  const absData = path.isAbsolute(dataPath) ? dataPath : path.join(repoRoot, dataPath);
  if (!fs.existsSync(absData)) {
    throw new Error(`Data file not found: ${absData}`);
  }

  const data = JSON.parse(fs.readFileSync(absData, 'utf8'));
  const dataDir = path.dirname(absData);
  const output =
    args.output
      ? path.isAbsolute(args.output)
        ? args.output
        : path.join(repoRoot, args.output)
      : absData.replace(/\.json$/i, '.html');

  const html =
    data.type === 'gap-analysis'
      ? renderGapAnalysis(data, dataDir, repoRoot)
      : renderComparison(data, dataDir, repoRoot);

  fs.writeFileSync(output, html, 'utf8');
  console.log(JSON.stringify({ output: path.relative(repoRoot, output) }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
