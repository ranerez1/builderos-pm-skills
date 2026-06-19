# Evals — `/12-ingest-knowledge`

A five-minute behavioral check. Six fixtures, ~18 assertions, no CI, no harness. Run before each release that changes step 4, 5, or 6 of `skills/12-ingest-knowledge/SKILL.md`.

## How to run

1. Pick a scratch workspace (or any directory outside this repo) — these evals write to `Knowledge/_inbox/`, so don't run them in a real workspace.
2. Copy the seeded state and fixtures into the scratch workspace:

   ```bash
   cp -R evals/seeds/Knowledge "$SCRATCH/"
   cp evals/fixtures/*.md "$SCRATCH/Knowledge/_inbox/"
   ```

3. From the scratch workspace, run:

   ```
   /12-ingest-knowledge --dry-run --source=_inbox --since=2026-06-01
   ```

4. Compare the proposal table and report against the assertions below. Pass/fail by eye.
5. For the `--auto-approve=appends-only` eval, re-run without `--dry-run` and with `--auto-approve=appends-only` against fixtures 03 + 04 only.

## Assertions

### 01-customer-call.md — Zoom call with Acme ops manager about a billing edge

- ✅ Salience filter **keeps** it.
- ✅ Produces **2 routing rows**: one `04-ICP/ops-manager.md` (APPEND or CREATE depending on seed), one `02-Product-Knowledge/billing-edges.md` (APPEND — seeded).
- ✅ Both proposed section bodies end with a `Related: …` line pointing at the sibling file.

### 02-internal-standup.md — Internal Monday-morning standup

- ✅ Salience filter **drops** it.
- ✅ **0 routing rows** for this fixture.
- ✅ Report includes `1 skipped as noise` (at least).

### 03-existing-topic.md — Drive doc on billing-edge cases

- ✅ Exactly **1 row**, action `APPEND`, target `02-Product-Knowledge/billing-edges.md` (the seeded file).
- ✅ Does **not** propose a new file (e.g. `billing-edge-cases.md`) — must match the seeded one.

### 04-new-topic.md — Drive doc on a brand-new market topic (Brazil SMB)

- ✅ Exactly **1 row**, action `CREATE`.
- ✅ Filename is a topic slug (no `YYYY-MM-DD_` prefix).
- ✅ Proposed body includes an **H1** and a **1–3 sentence concept summary** before the first dated section.

### 05-pasted-transcript.md — Raw transcript pasted into the body

- ✅ Proposed section body is a **summary**, not a paste — the proposal should be ≤ ~30% of the fixture's length.
- ✅ None of the speaker-labelled lines (`Ran:`, `Pat:`) appear verbatim in the proposal.

### 06-duplicate.md — Same `source_id` as fixture 01

- ✅ Skipped silently via manifest dedupe (after fixture 01 has been ingested at least once — for `--dry-run`, simulate by manually adding an entry to `Knowledge/_ingested/manifest.jsonl` with the same `source_id`).
- ✅ Report includes `1 deduped` (at least).

## `--auto-approve=appends-only` eval

Run after the six above pass:

1. Reset scratch workspace, copy only fixtures `03-existing-topic.md` + `04-new-topic.md` into `_inbox/`.
2. Run `/12-ingest-knowledge --auto-approve=appends-only --source=_inbox --since=2026-06-01`.
3. Assert:
   - ✅ `Knowledge/02-Product-Knowledge/billing-edges.md` has a new dated section appended (from fixture 03).
   - ✅ `Knowledge/_inbox/pending-review.md` exists and contains an entry for the new market topic from fixture 04.
   - ✅ `Knowledge/03-Market-Knowledge/` does **not** contain a new file from this run.

## Optional: LLM judge

For automation, feed the proposal-table output + this README's assertions list to a Claude call using `evals/judge-prompt.md` as the system prompt. The judge returns pass/fail per assertion with a one-line reason. No structured eval framework needed.

## When to re-run

- Before tagging any release that changes step 4 (routing), step 5 (proposal), or step 6 (writes) in `SKILL.md`.
- After editing the salience filter prompt in step 3.5.
- After editing any of the fixtures themselves (sanity check that the fixture still expresses the intent it claims).

## What this isn't

- Not a CI gate. Not a coverage report. Not a regression harness.
- Not a test of the upstream MCP fetch step (those are MCP-server concerns).
- Not an exhaustive doc-type matrix — six fixtures cover the invariants; more is maintenance burden.
