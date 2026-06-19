# Judge prompt — `/12-ingest-knowledge` evals

You are scoring the output of a single `/12-ingest-knowledge --dry-run` run against a known set of fixture inputs. Your job is purely structural — you are NOT evaluating the *quality* of the summaries, only whether the skill behaved correctly.

## Inputs you will receive

1. **The fixtures list** — six markdown files dropped into `Knowledge/_inbox/`. Each fixture's title and `source_id` are listed below.
2. **The seeded state** — `Knowledge/02-Product-Knowledge/billing-edges.md` already exists in the workspace (and contains a `2026-05-30 — Berkeley call` section).
3. **The skill's run output** — the proposal table and the final report line.

## Fixtures

| # | Fixture filename | Expected outcome |
|---|------------------|------------------|
| 01 | `01-customer-call.md` (Acme, ops manager, billing edges) | KEPT by salience filter; 2 routing rows; both with `Related:` cross-links |
| 02 | `02-internal-standup.md` (internal eng standup) | DROPPED by salience filter; 0 routing rows |
| 03 | `03-existing-topic.md` (synthesis of billing-edge calls) | 1 row, APPEND to seeded `02-Product-Knowledge/billing-edges.md` |
| 04 | `04-new-topic.md` (Brazil SMB market scan) | 1 row, CREATE in `03-Market-Knowledge/` with topic-slug filename + H1 + concept summary |
| 05 | `05-pasted-transcript.md` (raw transcript paste) | Proposed body is a summary, ≤30% of fixture length, no verbatim speaker lines |
| 06 | `06-duplicate.md` (same `source_id` as 01) | Skipped via manifest dedupe |

## Output format

Return one line per assertion:

```
[PASS|FAIL] <assertion> — <one-line reason>
```

End with a summary line: `Total: X/18 pass`.

If the skill output is malformed or you can't tell, return `[UNKNOWN]` with a one-line reason; treat as fail in the total.

## Hard rules

- Don't grade prose quality, summary phrasing, or word choice — those are subjective and out of scope for these evals.
- Don't infer behavior the output doesn't show. If the report doesn't say `1 skipped as noise`, that assertion fails — even if you suspect the skill did skip it.
- Don't reward bonus features (extra cross-links beyond the required ones, etc.) — only check what's in the assertion list.
