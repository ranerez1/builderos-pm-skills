---
name: 03-cto-planner
description: Technical brainstorm partner that stress-tests an initiative against the existing codebase to surface gaps, edge cases, and open questions before writing a TDD. Run after /02-pm-planner and before /06-prd-to-tech-plan to make the resulting Technical Design Doc grounded and actionable. Use when the user asks for a technical brainstorm, pre-TDD review, or runs /03-cto-planner.
---

# Technical Brainstorm (pre-TDD)

This is a **technical brainstorm partner**, not a CTO execution plan and **not a TDD**. The goal is to ground an initiative in the actual codebase and produce the **questions, gaps, and edge cases** that will make `/06-prd-to-tech-plan` produce a much better Technical Design Doc.

- Run **after** `/02-pm-planner` (chosen initiative + MVP shape).
- Run **before** `/06-prd-to-tech-plan` so the TDD isn't hand-wavy.

## Inputs (ask only if missing)

- **Preferred inputs** (auto-ingest when available):
  - `Outputs/Planning/<initiative>/pm-high-level.md` (or highest `pm-high-level_vN.md`)
  - `Outputs/Planning/<initiative>/design-high-level.md` (or highest `design-high-level_vN.md`)
- If those are not available, gather:
  - **Initiative**: name + 1–2 lines
  - **Chosen candidate / MVP shape**: what specifically is in scope
  - **Non-goals**: what is explicitly out
  - **Constraints**: timing, platform, dependencies, compliance
  - **Non-functional needs (if any are known)**: latency, scale, reliability, security/compliance, data retention

Mark unknowns with `[NEED: ...]` (matching the `/02-pm-planner` convention).

## Workflow

### 0) Pull in existing workspace context (before asking questions)

Before asking the user for missing inputs, scan for relevant context and reuse it.

- Look for anything relevant in:
  - `Knowledge/`
  - `Learnings/`
  - `Outputs/Planning/<initiative>/` (if initiative is known)
- If initiative planning files exist, **use them as upstream context** (do not summarize; use directly) instead of asking the user to paste them.

### 0.5) Reuse existing initiative planning outputs (when available)

If `Outputs/Planning/<initiative>/` exists, load these as upstream context (do not summarize; use directly):

- `pm-high-level.md` and any `pm-high-level_v*.md`
- `design-high-level.md` and any `design-high-level_v*.md`
- `tech-high-level.md` and any `tech-high-level_v*.md`

If multiple versions exist for a role, prefer the **highest `_vN`**; otherwise use the base file.

### 1) Ingest PM intent (no re-derivation)

- Restate from the PM Plan:
  - **Outcome** (what changes for users)
  - **MVP scope** vs **non-goals**
  - **Evidence** (so we don't overbuild)
- **Discovery-first branch**: if the PM picked a discovery / validation candidate, shift focus to "what would we instrument and what data would tell us this works" — do **not** stress-test architecture for a feature that hasn't been validated yet.

### 2) Targeted codebase scan

Stay grounded in the actual repo.

- Identify the **likely-affected modules / files** from the initiative description.
- Read those files, then follow imports **1 hop** to understand neighbors.
- Note existing patterns near the change site:
  - auth / authorization
  - error handling
  - logging
  - data access / ORM / queries
  - feature flags / config
- Identify **public contracts** that might be affected (APIs, events, schemas, shared interfaces).

### 3) Map current state → desired state

- Where the change would live (packages / modules).
- Patterns to **follow** vs. patterns to **deliberately diverge** from (and why).
- **Sharp edges**: legacy code, technical debt, hidden coupling that the initiative would touch.

### 4) Surface gaps & questions (core deliverable)

- **Edge cases**: empty / partial state, concurrency (multi-device, retries, offline), timezone / locale, permission denied / missing entitlements.
- **Failure modes**: network failures, API timeouts, partial writes, data corruption / migration mismatch, third-party degradation.
  - For each, suggest an MVP handling stance: **block / degrade / recover / ignore-with-guardrail**.
- **Data**: schema impact, migrations, backfill, backwards compatibility.
- **Auth / privacy**: who can see / do what, PII boundaries.
- **Performance**: hot paths, N+1, caching, latency budgets.
- **Observability**: how would we know it's working / broken (logs, metrics, traces, alerts)?
- **Open questions for PM** (the most valuable output): what scope / sequencing / UX decision would change the technical answer? Each question gets a **PM-facing implication** (what changes if the PM picks A vs B).

### 5) Risks & off-ramps (grounded in code)

- Top 3–5 risks specifically grounded in findings from Steps 2–3 (not generic).
- **Kill criteria / off-ramps**: what would tell us to stop or change course (e.g., spike result, dependency unavailable, data not present).
- For each risk → **what the PM should consider changing** (scope, sequencing, guardrails, comms).

### 6) Pre-TDD checklist (explicit handoff)

- **Decisions to lock before `/06-prd-to-tech-plan`** (so the TDD has concrete inputs).
- **Specific files / modules / contracts the TDD must reference**.
- **Unknowns to resolve**, marked `[NEED: ...]`.

## Output (files)

Write a single markdown file to:

- Directory: `Outputs/Planning/<initiative>/`
- File: `tech-high-level.md`

### Folder handling

- Ensure `Outputs/Planning/` exists.
- Ensure `Outputs/Planning/<initiative>/` exists (create if missing).

### Existing file handling

- If `tech-high-level.md` does **not** exist, create it.
- If `tech-high-level.md` **does** exist, ask the user whether to:
  - **Update existing** (overwrite `tech-high-level.md`), or
  - **Create new version** (write `tech-high-level_vN.md`)

### Version naming (`_vN`)

- Use the next available integer `N` based on files matching `tech-high-level_v*.md` in the initiative folder.
- If `tech-high-level.md` exists and no versions exist, the first version is `tech-high-level_v2.md`.

### File contents

Use this template:

```markdown
## Tech High-Level: [initiative]

### PM intent (as understood)
- Outcome:
- MVP scope:
- Non-goals:
- Evidence:

### Codebase findings (targeted scan)
- Likely-affected modules / files:
- Existing patterns to follow (auth / errors / logging / data access / feature flags):
- Sharp edges / legacy / hidden coupling:
- Public contracts at risk:

### Edge cases & failure modes
- Edge cases:
- Failure modes + handling (block / degrade / recover / ignore-with-guardrail):

### Data / auth / performance / observability
- Data / schema / migrations:
- Auth / privacy:
- Performance / hot paths / latency budget:
- Observability (how we'd know it works / breaks):

### Open questions for PM (ordered by leverage)
1. Question — PM implication (scope / sequencing / guardrail change):
2. ...

### Risks & off-ramps
- Risks (grounded in code):
- Kill criteria / off-ramps:
- For each risk → PM implication:

### Pre-TDD checklist
- Decisions to lock before `/06-prd-to-tech-plan`:
- Files / modules / contracts the TDD must reference:
- Unknowns to resolve: `[NEED: ...]`
```

Related: once gaps and questions are answered, run `/06-prd-to-tech-plan` to produce the TDD.
