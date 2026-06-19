---
source: notetaker
source_id: fathom-eval-05-raw-transcript
url: https://fathom.video/calls/eval-fixture-05
date: 2026-06-15
title: Discovery call — Delta Co (raw transcript)
participants: Ran, Sam Chen (Delta Co, product lead)
---

# Discovery call — Delta Co (raw transcript)

Sam: Hey Ran, thanks for jumping on. Can you hear me okay?

Ran: Yeah, all good. Thanks for making time.

Sam: So I read your one-pager. The thing that caught my eye was the reconciliation workflow. We have a real mess there.

Ran: Tell me more about what the mess looks like today.

Sam: So every month, my ops lead spends about four days closing the books. She's got Stripe, she's got our marketplace payouts, she's got refunds, and they all live in different places. She exports CSVs, drops them in a Google Sheet, and then we have a custom Apps Script that tries to match them up. It works maybe 80% of the time.

Ran: And the other 20%?

Sam: She manually fixes. Which usually means hunting down a transaction in Stripe, figuring out why our script didn't match it, and then either patching the script or just writing a line of CSV by hand. It's gross.

Ran: How long has this been the situation?

Sam: Eighteen months. We've talked about hiring a finance ops person but it feels insane to add headcount to paper over a tooling problem.

Ran: What would good look like for you?

Sam: She presses a button on the first of the month, and forty minutes later she has a clean reconciled ledger. That's it. I don't need fancy reporting, I don't need dashboards, I just need the matching to work.

Ran: Got it. Walk me through the marketplace payouts side — that's not Stripe, right?

Sam: Right, that's Adyen for the marketplace, and the payout schedule is different from Stripe. So even just aligning the timestamps is a pain.

Ran: Okay. And the Apps Script — who maintains that?

Sam: My ops lead, mostly. I help when it breaks badly. It's a few hundred lines.

Ran: Cool, that's super helpful. Let me ask a different question — if we built exactly the thing you described, would you pay for it?

Sam: I'd pay for it tomorrow. We'd be a customer next week.

Ran: Even if it was only for Stripe and Adyen, not generic?

Sam: Yes. Those are the two we have. Anything else is a future problem.

Ran: Okay, that's really useful. Let me think on what we showed you and follow up next week.

Sam: Sounds good.
