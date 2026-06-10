---
name: 12-ingest-knowledge
description: Ingests external docs (Google Drive, Zoom recordings, Fathom/Otter/Fireflies/Granola/Gong/Timeless transcripts, Gmail attachments, local Inbox files) and routes them as token-efficient structured md cards into the right Knowledge/ subfolder (02-Product-Knowledge, 03-Market-Knowledge, 04-ICP, 06-Projects). Propose-then-confirm before any write. Use when the user asks to ingest/import/sync docs, transcripts, meeting notes into Knowledge, refresh the knowledge base, or runs /12-ingest-knowledge.
---

# 12 Ingest Knowledge → partition external docs into `Knowledge/`

Pull raw material from external sources and write **token-efficient structured cards** into `Knowledge/02-Product-Knowledge`, `03-Market-Knowledge`, `04-ICP`, or `06-Projects`. Never store raw transcripts. Always propose-then-confirm before writing.

This skill **builds the durable Knowledge layer** that other skills (`01-customer-discovery`, `02-pm-planner`, `05-create-prd`, `09-pm-reviewer`) read every time they run. Compression matters: every line written here costs tokens forever.

## Configuration

Read **`Knowledge/workspace-tools.md`** for source connectors. Look under:

- **Knowledge Sources › Google Drive** — folder URLs + MCP server name (or local mount path)
- **Knowledge Sources › Zoom** — account email + MCP server name
- **Knowledge Sources › Notetakers** — one block per service in use: Fathom, Timeless, Otter, Fireflies, Granola, Gong (kind + MCP server name OR local export folder)
- **Knowledge Sources › Gmail labels** — label names to scan (uses the `gmail-personal` MCP server)
- **Knowledge Sources › Local Inbox** — always `Knowledge/_inbox/`

If a source isn't configured, skip it silently and report which sources were scanned.

## Routing rubric

Read each Knowledge subfolder's `README.md` as the authoritative classification rubric:

- `Knowledge/02-Product-Knowledge/README.md` — Product Insight Cards (area, claim, evidence)
- `Knowledge/03-Market-Knowledge/README.md` — Market Signal Cards (segment, signal_type)
- `Knowledge/04-ICP/README.md` — Persona / Account Cards (append-heavy)
- `Knowledge/06-Projects/README.md` — Project Context Notes (decisions, constraints)

`01-Templates/` and `05-Workspace-Tools/` are hand-curated. **Never write to them.**

## Workflow

### 0) Validate Knowledge layout

1. Check `Knowledge/{01-Templates,02-Product-Knowledge,03-Market-Knowledge,04-ICP,05-Workspace-Tools,06-Projects,_inbox,_ingested}` exist.
2. For each missing subfolder: create it with a `.gitkeep`. For each subfolder missing a `README.md`: skip (the human owns these — report it, don't auto-write).
3. Create `Knowledge/_ingested/manifest.jsonl` if missing.
4. Report what was scaffolded vs. already present. **Idempotent**: re-runs with everything in place do nothing in this step.

### 1) Plan intake

1. Read `Knowledge/workspace-tools.md` and enumerate configured sources.
2. Print the list to chat with this turn's defaults: time window (default: last 14 days), source set (default: all configured), limit per source (default: 25).
3. Ask the user to confirm or override before fetching anything.

### 2) Fetch raw docs

For each confirmed source, pull docs via its MCP server (or read from `Knowledge/_inbox/` for local files). Normalize each doc to:

```
{source, source_id, url, date, title, participants, raw_text}
```

`raw_text` is held in memory only — **never written to disk**.

### 3) Dedupe

Read `Knowledge/_ingested/manifest.jsonl`. Skip any doc whose `source_id` (or stable URL hash) already appears. Report skips by count.

### 4) Classify each doc

For each remaining doc, produce:

- `target_folder` — one of `02-Product-Knowledge` / `03-Market-Knowledge` / `04-ICP` / `06-Projects` (never `01` or `05`)
- `schema` — matches the target folder's README (product-insight / market-signal / persona-card / account-card / project-context)
- `proposed_filename` — `YYYY-MM-DD_<slug>.md` if new card, or `APPEND → <existing-file>` if matching card exists
- `entities` and `intents` — controlled vocabulary tags from the README
- `claims` — 1–5 atomic factual bullets, each ≤ 20 words, each with an evidence pointer
- `confidence` — high / medium / low + one-line reason

**Splitting**: if a single doc yields claims for multiple folders (common for customer calls), propose **multiple cards**, one per folder. Each card is independent.

**Append detection**: before proposing a new file, grep the target folder for files with overlapping `entities` + `intents`. If a strong match exists, propose `APPEND` to that file rather than a new file.

### 5) Propose-then-confirm

Print a single table to chat:

```
| # | source            | → target file                                  | schema          | claims | conf  |
|---|-------------------|------------------------------------------------|-----------------|--------|-------|
| 1 | Zoom 2026-06-08   | 04-ICP/ops-manager.md (APPEND)                 | persona-card    | 2      | high  |
| 2 | Zoom 2026-06-08   | 02-Product-Knowledge/2026-06-08_billing-edge.md| product-insight | 3      | med   |
| 3 | Drive doc "TAM"   | 03-Market-Knowledge/2026-06-08_smb-tam.md      | market-signal   | 4      | high  |
```

Ask: **approve all / approve subset / edit row / reject row**. No writes happen until the user confirms.

For each approved row, show the full card body the skill is about to write so the user can spot-check.

### 6) Write approved cards

For each approved row:

1. **New file**: write the card using the target folder's schema. Hard cap: ≤ 40 lines, ≤ 1500 tokens. If a card would exceed this, split into two more-focused cards or drop the weakest claims (report what was dropped).
2. **Append**: open the existing file, append one evidence bullet under the right section, bump `evidence_count` (or `quotes_count`) and `last_seen` in frontmatter. Do not rewrite the file.
3. Append one line to `Knowledge/_ingested/manifest.jsonl`:

```json
{"ts":"YYYY-MM-DDTHH:MM:SSZ","source":"zoom","source_id":"...","url":"...","wrote":["04-ICP/ops-manager.md","02-Product-Knowledge/2026-06-08_billing-edge.md"],"action":["append","create"],"confidence":["high","medium"]}
```

### 7) Report

Print: docs scanned / deduped / proposed / approved / written / rejected. List the file paths written. Flag any cards the user should review (medium/low confidence, or split cards).

## Token-efficient encoding rules (the core constraint)

Every card written must obey these — they are the reason this skill exists rather than dumping transcripts into `Knowledge/`:

1. **Never write raw transcript text.** The raw doc stays at `source_url`.
2. **Frontmatter carries all metadata.** No repeating dates/sources/participants in the body.
3. **Bullets, not prose.** One atomic claim per line, ≤ 20 words.
4. **Evidence as a pointer**, not a paragraph: `evidence: [Zoom 14:32](url#t=14:32)` or `evidence: "first 6–8 words…" [link]`. Never paste the full quote.
5. **One card per (folder × focused topic)**. A single doc may yield several small cards rather than one big one.
6. **Append before create.** Same entity+intent → add an evidence line to the existing card.
7. **Hard caps**: 40 lines / 1500 tokens per card. Reject and split or down-confidence if the doc resists compression.
8. **Controlled vocabulary** for `entities` and `intents` so downstream skills can grep cheaply (see each folder's README).

## Flags

- `--auto-approve=high-confidence` — skip the confirm step for high-confidence rows; queue medium/low into `Knowledge/_inbox/pending-review.md` for the next interactive run. Used by the scheduled mode.
- `--source=<name>` — limit to one configured source (e.g. `--source=zoom`).
- `--since=YYYY-MM-DD` — override the default 14-day window.
- `--dry-run` — classify and propose, never write or append to the manifest.

## Continuous / scheduled mode

This skill takes no special action for scheduling. Use the existing `/schedule` skill:

```
/schedule "daily at 7am" /12-ingest-knowledge --auto-approve=high-confidence --since=yesterday
```

The scheduled run uses `--auto-approve=high-confidence` so it doesn't block on prompts; anything ambiguous lands in `_inbox/pending-review.md` for the next manual run.

## Hard rules

- **Read-only on source systems**. Never write back to Drive, Zoom, notetakers, or Gmail.
- **No writes to `01-Templates/` or `05-Workspace-Tools/`** (hand-curated).
- **No raw transcripts in any written file.**
- **Propose-then-confirm by default**; only `--auto-approve=high-confidence` skips confirmation, and only for high-confidence rows.
- **Manifest every write** to `Knowledge/_ingested/manifest.jsonl` — this is the dedupe and audit trail.
- **Idempotent re-runs**: same inputs, same outputs, no duplicate writes.
