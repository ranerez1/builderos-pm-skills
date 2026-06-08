---
name: 01-customer-discovery
description: Synthesizes customer feedback from transcripts, notes, CSVs, and other configured sources into the top user-problem trends (problem space only). Read-only: does not write back to source systems. Use when the user asks to analyze customer calls, meeting transcripts, call notes, voice-of-customer insights, or runs /01-customer-discovery.
---

# 01 Customer Discovery → top problem trends (read-only)

Turn customer feedback (meetings, calls, notes, CSV exports, etc.) into:

- Up to **5 key trends/themes** that reveal the **core user problems** (what repeats, who it affects, and why it matters now)

This skill is **read-only**: It does not write back to the source tool, and do not create backlog items.

## Configuration

Before running, read **`Knowledge/workspace-tools.md`** and use the values under:

- **Customer Discovery / Customer Meeting Transcripts** (primary)
- **Attachments (optional)** (if you need to fetch/read attached files)

All tool URLs/IDs and MCP server names must come from that file.

## Supported sources (choose what’s configured)

Use **one or more** of the following, based on what’s present in `Knowledge/workspace-tools.md`:

1) **Tool/MCP source** (recommended)
   - A “Customer Meeting Transcripts” board/database/folder exposed via its MCP server
   - Pull meeting content from long-text fields, item updates/comments, and attached files when available

2) **Local CSV export** (recommended when you already have an export)
   - Read one or more CSVs from local paths listed in `Knowledge/workspace-tools.md`
   - Parse the CSV and treat each row as one feedback record (meeting, call, ticket-like note, etc.)

3) **Other sources listed in workspace tools**
   - If `Knowledge/workspace-tools.md` lists additional customer-feedback sources (e.g. a Drive folder, Notion DB, docs folder, etc.), ingest them using the referenced tool/MCP server and document any limitations.

## Default scope

- Prefer the **most recent 30–90 days** of feedback if dates exist.
- If the source is large and filtering isn’t available, cap intake to a **sane batch (e.g. 30–50 records)** and clearly state the cap.

## Workflow

### 0) Decide intake plan (no guessing)

1. Read `Knowledge/workspace-tools.md`.
2. List which sources are actually configured (CSV paths, tool URLs/IDs, MCP server names).
3. If multiple sources are configured, combine them; otherwise use what exists.
4. If nothing is configured, stop and state exactly what’s missing in `Knowledge/workspace-tools.md`.

### 1) Ingest records + normalize fields

For each record (meeting/call/note), capture best-effort:

- **Record reference**: title/name + link (preferred) or an ID; for CSV use a stable row identifier (row number + filename)
- **Date** (if present)
- **Customer context**: company/account, persona/role, plan/segment (if present)
- **Product area** (if tagged/inferrable)
- **Raw text**: transcript/notes/summary (keep a pointer to where it came from)

CSV expectations (best-effort; do not require all columns):

- Treat any of these as “text”: `transcript`, `notes`, `summary`, `feedback`, `highlights`
- Treat any of these as “customer”: `account`, `company`, `customer`, `persona`, `role`
- Treat any of these as “date”: `date`, `meeting_date`, `created_at`
- If column names don’t match, infer conservatively and state your mapping.

### 2) Extract signals per record (with evidence)

From each record, extract only what’s supported by the text:

- **Jobs-to-be-done / desired outcomes**
- **Pain points** (friction, confusion, time waste, manual work, reliability)
- **Requests** (features, integrations, missing capabilities)
- **Bugs** (clear malfunction statements)
- **Workarounds** (what they do instead)
- **Importance signals** (urgency, frequency, “deal breaker”, “must-have”)

Evidence rules:

- Every extracted point must include **1 short quote/snippet** (or a clearly marked paraphrase if the source is summarized).
- Never invent customer names, dates, or quotes.

### 3) Synthesize trends (the main deliverable)

Cluster across all records into trends. For each trend, compute/estimate:

- **Theme**: what repeats (one sentence)
- **Frequency**: count of distinct records mentioning it (and % of total records ingested)
- **Who/where**: segment/persona/product area if evidence exists
- **Severity**: what breaks (time, money, trust, adoption), and whether it blocks adoption vs. “nice-to-have”
- **Representative evidence**: 2–4 record citations with short snippets
- **Opportunity framing**: the underlying outcome/job (not a solution)

De-duplicate aggressively; prefer **up to 5** trends over a long list.

### 4) Output (chat + file)

Use this exact template.

```markdown
## Customer discovery summary
- **Sources used**: [tool(s) + CSV filenames/paths]
- **Records ingested**: [N] (date range if known)
- **Coverage notes**: [caps, missing fields, sampling caveats]

## Key trends (themes)
1) **[Trend theme]**
   - **Frequency**: [k/N] ([%])
   - **Who/where**: [segment/persona/product area if known]
   - **Why it matters**: [1–2 sentences]
   - **Underlying outcome (opportunity)**: [1 sentence]
   - **Evidence**:
     - [Record title] — [link/id or CSV row ref] — “[…]”
     - [Record title] — [link/id or CSV row ref] — “[…]”

... (1–5 trends total)
```

### 5) Save output to file (local)

Also save the same markdown output to:

- Folder: `Outputs/Discovery/` (create if missing)
- Filename:
  - `Outputs/Discovery/YYYY-MM-DD_customer-discovery.md`
  - If a single dominant source exists, append a short slug, e.g. `YYYY-MM-DD_customer-discovery_meetings.md`

The saved file must match the chat output verbatim (no extra sections).

## Hard rules

- **No writes**: do not change any source system state, do not create columns, do not add updates/comments, do not create backlog items.
- **Evidence required**: every trend must cite real records; if evidence is weak, say so.
- **No hallucinations**: if a field doesn’t exist, state it as missing.
- **Prefer trends over anecdotes**: highlight what repeats and quantify frequency whenever possible.

