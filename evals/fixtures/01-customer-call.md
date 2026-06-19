---
source: zoom
source_id: zoom-eval-01-acme-billing
url: https://zoom.us/rec/share/eval-fixture-01
date: 2026-06-18
title: Acme — billing reconciliation pain
participants: Ran (us), Pat Morgan (Acme, ops manager)
---

# Acme — billing reconciliation pain (Zoom, 45 min)

Pat is the ops manager at Acme, a mid-market SaaS company. Customer call, not internal. Discussed how Pat handles weekly billing reconciliation and where our product creates friction at the edges.

## Key points

- Pat owns Monday-morning reconciliation across three Stripe accounts. Currently exports CSVs and joins them in Excel.
- The manual CSV export workflow is the single biggest weekly pain — takes ~90 minutes, mostly waiting for exports to finish and re-formatting timestamps.
- Acme is considering switching billing platforms partly because of this — said "if you can fix the CSV thing we'd stop looking."
- Pat asked if our product handles partial refunds and chargebacks consistently. Said competing tool gets confused when a refund crosses a fiscal month boundary.
- Pat is Excel-fluent, doesn't want SQL, doesn't want an API integration. Wants the CSV to "just be right."

## Asks

- Better timestamp normalization across Stripe accounts.
- Partial-refund handling that respects fiscal-month boundaries.
- A "Monday morning" preset that batches the export.

## Quote (paraphrased)

> "I block out 9–10:30am Monday for this. If you saved me an hour I'd be your biggest fan."
