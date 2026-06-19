---
source: drive
source_id: drive-eval-03-billing-edges-research
url: https://drive.google.com/file/d/eval-fixture-03/view
date: 2026-06-17
title: Billing edges — research notes from three calls
participants: Ran
---

# Billing edges — synthesis from recent calls

Synthesized notes from three customer calls this month (Acme, Berkeley, Carrera) about how our product behaves at billing edge cases — partial refunds, chargebacks, fiscal-month rollovers, multi-currency.

## Patterns across the three calls

- All three customers manually reconcile partial refunds outside our product because our CSV export doesn't preserve refund-to-original linkage.
- Two of three flagged fiscal-month rollovers as a footgun — refunds dated in the previous month land in the current month's export.
- Multi-currency reconciliation came up at Carrera only — they operate in EUR, GBP, USD and need per-currency subtotals on the export.

## Concrete asks

- Refund linkage in CSV (parent transaction id column).
- Fiscal-month-aware export option.
- Per-currency subtotals.

These all converge on the same product surface: the export pipeline.
