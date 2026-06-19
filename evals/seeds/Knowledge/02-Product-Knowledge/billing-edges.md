# Billing edges

How our product behaves at billing edge cases — partial refunds, chargebacks, fiscal-month rollovers, multi-currency exports. Mostly surfaces in the CSV export pipeline, which is where ops users do reconciliation. Seeded for evals; real-world cards should accumulate via `/12-ingest-knowledge`.

## 2026-05-30 — Berkeley call (initial signal)

Source: [Zoom](https://zoom.us/rec/share/seed-berkeley) · participants: Ran, Casey (Berkeley)

- Berkeley flagged that partial refunds disappear from the monthly CSV when they cross a fiscal-month boundary.
- Asked for an explicit "refund linkage" column tying refund rows back to the original transaction.
- First time we'd heard the fiscal-month edge case from a customer.
