---
source: zoom
source_id: zoom-eval-01-acme-billing
url: https://zoom.us/rec/share/eval-fixture-01
date: 2026-06-18
title: Acme — billing reconciliation pain (duplicate of 01)
participants: Ran (us), Pat Morgan (Acme, ops manager)
---

# Duplicate of fixture 01

This file has the same `source_id` as `01-customer-call.md`. The skill must skip it via manifest dedupe on the second-and-later run.

To test in `--dry-run` mode, manually pre-seed `Knowledge/_ingested/manifest.jsonl` with:

```json
{"ts":"2026-06-18T15:00:00Z","source":"zoom","source_id":"zoom-eval-01-acme-billing","url":"https://zoom.us/rec/share/eval-fixture-01","wrote":["02-Product-Knowledge/billing-edges.md","04-ICP/ops-manager.md"],"action":["append","create"]}
```

Then the dedupe assertion in `README.md` will hold for this fixture even on a single dry-run.
