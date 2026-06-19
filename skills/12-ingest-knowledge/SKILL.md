---
name: 12-ingest-knowledge
description: Ingests external docs (Google Drive, Zoom recordings, Fathom/Otter/Fireflies/Granola/Gong/Timeless transcripts, Gmail attachments, local Inbox files) into the right Knowledge/ subfolder (02-Product-Knowledge, 03-Market-Knowledge, 04-ICP, 06-Projects) as markdown files. One topic file per folder, append by default. Propose-then-confirm before any write. Use when the user asks to ingest/import/sync docs, transcripts, meeting notes into Knowledge, refresh the knowledge base, or runs /12-ingest-knowledge.
---

# 12 Ingest Knowledge → capture external docs as markdown into `Knowledge/`

Pull raw material from external sources and write it as **markdown sections in topic files** under `Knowledge/02-Product-Knowledge`, `03-Market-Knowledge`, `04-ICP`, or `06-Projects`. Bias toward **one topic file per folder**, appending new evidence as a dated section. Never store raw transcripts. Always propose-then-confirm before writing.

This skill **builds the durable Knowledge layer** that other skills (`01-customer-discovery`, `02-pm-planner`, `05-create-prd`, `09-pm-reviewer`) read every time they run.

## Configuration

Read **`Knowledge/workspace-tools.md`** for source connectors. Look under:

- **Knowledge Sources › Google Drive** — folder URLs + MCP server name (or local mount path)
- **Knowledge Sources › Zoom** — account email + MCP server name
- **Knowledge Sources › Notetakers** — one block per service in use: Fathom, Timeless, Otter, Fireflies, Granola, Gong (kind + MCP server name OR local export folder)
- **Knowledge Sources › Gmail labels** — label names to scan (uses the `gmail-personal` MCP server)
- **Knowledge Sources › Local Inbox** — always `Knowledge/_inbox/`

If a source isn't configured, skip it silently and report which sources were scanned.

## Destination folders

- `Knowledge/02-Product-Knowledge` — product insights (your own product, features, edges)
- `Knowledge/03-Market-Knowledge` — market signals (competitors, segments, TAM, trends)
- `Knowledge/04-ICP` — persona / account context
- `Knowledge/06-Projects` — project-specific decisions, constraints, context

`01-Templates/` and `05-Workspace-Tools/` are hand-curated. **Never write to them.**

## Workflow

### 0) Validate Knowledge layout

1. Check `Knowledge/{01-Templates,02-Product-Knowledge,03-Market-Knowledge,04-ICP,05-Workspace-Tools,06-Projects,_inbox,_ingested}` exist.
2. For each missing subfolder: create it with a `.gitkeep`.
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

### 4) Route each doc

For each remaining doc, decide:

- **Folder** — one of `02-Product-Knowledge` / `03-Market-Knowledge` / `04-ICP` / `06-Projects` (never `01` or `05`).
- **Topic file** — list the existing files in that folder. Either pick the best-fit existing file (action: `APPEND`) or propose a new topic-slug filename (action: `CREATE`, e.g. `ops-manager.md`, `billing-edge-cases.md`, `smb-tam.md`). **No date-stamped filenames** — the date lives in the section heading inside the file, not the filename.

**Cross-folder docs**: if a single doc clearly spans two folders (common for customer calls that touch both persona signals and a feature ask), propose **two routing rows** for that doc — one per folder. Each row is still "doc → file," not "claim → file." Don't split a doc into more than two rows.

**Append bias**: prefer APPEND. Only propose CREATE when no existing file in the target folder fits the doc's topic.

### 5) Propose-then-confirm

Print a single table to chat:

```
| # | source                  | action  | → file                                  |
|---|-------------------------|---------|-----------------------------------------|
| 1 | Zoom 2026-06-19 (Acme)  | APPEND  | 04-ICP/ops-manager.md                   |
| 2 | Zoom 2026-06-19 (Acme)  | APPEND  | 02-Product-Knowledge/billing-edges.md   |
| 3 | Drive "TAM 2026 v3"     | CREATE  | 03-Market-Knowledge/smb-tam.md          |
```

Ask: **approve all / approve subset / edit row / reject row**. No writes happen until the user confirms.

For each approved row, show the section body the skill is about to write so the user can spot-check before it lands.

### 6) Write approved docs

For each approved row, write a new dated section into the chosen file:

```markdown
## 2026-06-19 — Zoom call with Acme (ops manager)

Source: [Zoom](https://zoom.us/rec/share/...) · participants: Ran, Pat

- Ran complained about manual CSV export every Monday morning.
- Confirms manual reconciliation pain — already noted on 2026-05-30.
- New: workflow takes ~90 min weekly; uses Excel pivot tables to summarise.
```

- For `APPEND`: open the file, append the section at the bottom. Don't rewrite or reorder existing sections. If the file is missing an opening concept summary (see below), add one above the first dated section as part of this write.
- For `CREATE`: create the file with an H1 title and a **1–3 sentence concept summary** describing what this topic is, then the first dated section. Example:

  ```markdown
  # Ops Manager

  Operations managers at mid-market SaaS companies who own weekly reconciliation
  workflows. They're our primary buyer for the billing-edge surface — typically
  Excel-fluent, time-boxed, and easily blocked by manual CSV exports.

  ## 2026-06-19 — Zoom call with Acme (ops manager)
  ...
  ```

  Why: downstream skills (PRD writing, customer discovery, reviewers) read top-of-file first. A short concept summary orients them in <100 tokens without scanning every dated section.
- Then append one line to `Knowledge/_ingested/manifest.jsonl`:

```json
{"ts":"YYYY-MM-DDTHH:MM:SSZ","source":"zoom","source_id":"...","url":"...","wrote":["04-ICP/ops-manager.md","02-Product-Knowledge/billing-edges.md"],"action":["append","create"]}
```

### 7) Report

Print: docs scanned / deduped / proposed / approved / written / rejected. List the file paths written.

## Content guidelines (light)

These are suggestions, not enforced rules. Use judgment.

- **Never paste raw transcripts.** The one hard rule. Pasted transcripts defeat the point of an ingested layer — they belong at the source URL. Summarise instead.
- **Open every topic file with a 1–3 sentence concept summary** under the H1, before any dated sections. It describes what the topic *is*, not what arrived today. Downstream skills (PRD, discovery, reviewers) read this first to orient cheaply. If you're appending to a file that lacks this summary, add one as part of the write.
- Lead each section with a one-line summary so the file stays scannable.
- Use bullets where bullets are clearer, prose where prose is clearer. No atomic-claim word limits.
- Link the source (Zoom URL, Drive URL, Gmail thread id) at the top of the section.
- A section can be one line or thirty — whatever fits the doc. No hard caps.
- When new evidence restates something already in the file, say so explicitly ("confirms X — already noted on YYYY-MM-DD") instead of repeating the full point.

## Flags

- `--auto-approve` — skip the confirm step and write everything the skill proposes. Used by the scheduled mode.
- `--source=<name>` — limit to one configured source (e.g. `--source=zoom`).
- `--since=YYYY-MM-DD` — override the default 14-day window.
- `--dry-run` — classify and propose, never write or append to the manifest.

## Continuous / scheduled mode

This skill takes no special action for scheduling. Use the existing `/schedule` skill:

```
/schedule "daily at 7am" /12-ingest-knowledge --auto-approve --since=yesterday
```

## Hard rules

- **Read-only on source systems**. Never write back to Drive, Zoom, notetakers, or Gmail.
- **No writes to `01-Templates/` or `05-Workspace-Tools/`** (hand-curated).
- **No raw transcripts in any written file.**
- **No date-stamped filenames.** Topic-slug filenames only; the date lives in the section heading.
- **Propose-then-confirm by default**; only `--auto-approve` skips confirmation.
- **Manifest every write** to `Knowledge/_ingested/manifest.jsonl` — this is the dedupe and audit trail.
- **Idempotent re-runs**: same inputs, same outputs, no duplicate writes.
