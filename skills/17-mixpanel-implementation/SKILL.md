---
name: 17-mixpanel-implementation
description: Guides a coding agent through implementing Mixpanel analytics correctly — self-contained, no companion files. Covers Quick Start (first events in one session), Full Implementation (production setup), Add Tracking (extend an existing setup), and Audit. Enforces identity, consent, and data-model critical rules and includes inline SDK init snippets. Use when the user wants to implement/set up Mixpanel, add Mixpanel tracking, audit a Mixpanel setup, or accepts the handoff from /16-measure-feature.
---

# Mixpanel implementation

**CRITICAL — DO NOT WRITE ANY TRACKING CODE YET.** This skill is a guided conversation, not a build template. Writing Mixpanel code before you have the inputs below produces a broken implementation — wrong SDK, wrong events, missing consent gates, or duplicate data.

## Relation to the other skills

This is the **build** step in the measurement loop:

**`/16-measure-feature` (define what to measure)** → **`/17-mixpanel-implementation` (instrument it)** → **`/14-mixpanel-data-analysis` (read it back)**.

If the user arrived from `/16`, they should have a **Tracking spec handoff** (primary metric + events + properties + identity touchpoints). Treat it as the draft tracking plan — it answers "what to track" — and still confirm SDK, CDP, and consent below before writing code. If they arrived cold, gather the inputs from scratch.

---

## Before writing ANY code, you must know ALL of:

1. **Mode** — Quick Start / Full Implementation / Add Tracking / Audit
2. **Platform** — determines the SDK; wrong SDK = full rewrite
3. **CDP?** — if they use Segment (or similar), direct SDK install is wrong; data must route through the CDP
4. **EU / California users?** — if yes, events fired before consent are a compliance violation requiring data deletion
5. **Value Moment** — the single most important user action (from `/16`'s primary metric if handed off)
6. **(Web/JS only) Autocapture and/or Session Replay?** — if Autocapture is on, do NOT also set `track_pageview: true` or write manual page-view events (duplicates)

**If you lack explicit answers to 2–5, ASK.** Do not assume, do not infer from the project name, do not start building.

---

## Mode selection — ask first

> "What brings you here today?"
> 1. **Quick Start** — first events into Mixpanel in one session
> 2. **Full Implementation** — complete, production-ready setup from scratch
> 3. **Add Tracking** — extend an existing implementation with new events
> 4. **Audit** — review and diagnose an existing implementation

State the selected mode explicitly and offer to switch at any point.

**Switching rules:** escalate to Full when identity-merge / consent / production-governance risk is high (always an *offer*, never automatic). Drop to Quick Start when the user just wants "something working first." If a prerequisite is missing (e.g. no tracking plan), pause and backfill it. At the end of each mode, summarize what's done, what remains, and recommended next steps.

---

## Compliance & privacy guardrails

Implementation guidance, not legal advice — customer policy and counsel win any conflict.

| Scenario | Default behavior |
|---|---|
| EU/EEA/UK/CH or CA users | Consent required before non-essential tracking; apply consent gate **before** SDK init |
| Region unknown | Ask once; if still unknown, use conservative consent-gated behavior |
| Server-side geo enrichment | Forward IP only if policy permits; else omit and document reduced geo resolution |
| Profile enrichment | Track minimum attributes only; avoid sensitive categories unless policy approves |

**Fail-safe:** if consent status is unknown in a regulated context, delay tracking init and clarify first.

---

## Pre-flight — codebase scan

**Run this before any mode if you have codebase access. Don't ask the customer anything yet.** Read silently and build a picture that replaces most discovery questions.

| Read | Extract |
|---|---|
| Routes / controllers / API endpoints | Candidate events (every meaningful user-initiated action) |
| DB models / schema | Candidate properties + types; User Profile fields; Group fields if B2B |
| Auth / session files (login, signup, logout) | Where to place `.identify()`, `.people.set()`, `.reset()`; whether anonymous browsing exists |
| Existing analytics/logging (GA4, Amplitude, Segment, `console.log`) | Draft event names; naming inconsistencies; properties already collected |
| Package files (`package.json`, `requirements.txt`, `build.gradle`, `Package.swift`, `pubspec.yaml`) | Exact stack → SDK selection |
| Env config (`.env`, `config/`, `settings.py`) | Where tokens inject; dev/prod split |

Present **assumptions** to the customer rather than asking from scratch. Only ask what the codebase can't answer.

---

## Quick Start flow

Compressed path. **Success = two events live in Mixpanel with basic identity wired in.**

1. **Mandatory questions** — platform, CDP?, EU/CA?, Value Moment (items 2–5 above).
2. **Context** — one-line product summary + the two events you'll ship: `sign_up_completed` and the Value Moment event.
3. **Mini tracking plan** — name both events (snake_case) + 2–4 properties each with types.
4. **Project setup** — create a **dev** project first; verify **Simplified ID Merge** is on and timezone is correct *before* sending anything.
5. **Implement + identity** — init the SDK (snippet below), fire both events, wire `.identify()` on login and `.reset()` on logout.
6. **Verify** — confirm both events in **Live View** with correct properties and identity.
7. **Wrap-up** — summarize what's live, what's next; offer to escalate to Full if identity/consent/CDP complexity surfaced.

---

## Full Implementation (Phases 0–8)

Each phase gates the next.

0. **Discovery** — business model, CDP/warehouse status, Group Analytics?, top business questions.
1. **Analytics strategy** — one named **Value Moment**; 2–3 KPIs, each tied to a business question. *(If handed off from `/16`, reuse its primary + supporting metrics here instead of re-deriving.)*
2. **Project setup** — dev + prod projects; **Simplified ID Merge verified**; timezone set at creation; consent flag documented.
3. **Data model** — events vs event properties vs user profiles vs super properties; Group Analytics scope confirmed or explicitly out.
4. **Tracking plan** — spec every event (name, trigger, properties, types); snake_case; stable enum values; reviewed + signed off by product, eng, analytics.
5. **Implementation readiness** — confirm codebase access. If **no access**, stop after producing a **Developer Handoff Spec** (file paths, env conventions, code style, the full tracking plan) and skip phases 6–7.
6. **Implementation** — init + event calls in the codebase; ≥1 event in dev Live View; tracking path (SDK/CDP/warehouse) matches discovery. Autocapture/Session-Replay rules enforced (below).
7. **Identity management** — `identify` / `reset` / profile + super-property ordering validated; multi-device and anonymous→auth flows tested.
8. **Data governance** — Lexicon populated; Data Standards + Event Approval on; governance owner + quarterly review named.

**Gate reviews:** don't advance a phase until its exit criteria are met; state the transition explicitly (e.g. "Phase 5 done — moving to Phase 6").

---

## Add Tracking mode

For an existing implementation gaining new events.

**Start with:** "What do you want to track? What question are you trying to answer?"

1. **Check existing schema** — review Lexicon / existing events for current naming conventions, properties, enum values **before** designing anything.
2. **Design new events** — reuse existing property names for the same concept; match established patterns.
3. **Spec review** — present event name, trigger, properties, types for approval **before** writing code.
4. **Implement** — use the SDK and patterns already in the codebase; if pre-flight ran, place code in the exact handler/endpoint files.
5. **Verify** — Live View: correct properties + identity linkage.
6. **Document** — Lexicon descriptions for every new event/property; add rows to the tracking-plan table in the project's `AGENTS.md`/`CLAUDE.md`.

If the existing setup has fundamental issues (identity bugs, naming chaos, missing consent gates) → recommend **Audit** first, then return here.

---

## Audit mode

For assessing/diagnosing an existing setup.

**Diagnose:** Lexicon naming consistency + descriptions + volume; `identify()`/`reset()` placement; tracking-plan gaps; common issues (duplicate events, inconsistent naming, missing super properties, numbers-as-strings, dynamic event names); consent posture for EU/CA.

**Prioritize fixes by severity:**
- **Critical** (data corruption) — identity bugs, consent violations, wrong ID merge mode
- **High** (data quality) — duplicate events, naming inconsistencies, missing properties
- **Medium** (maintainability) — missing Lexicon descriptions, no governance process
- **Low** (optimization) — missing super properties, suboptimal tracking method

**Execute** via Add Tracking (individual events) or Full Implementation (structural overhaul).

---

## Critical rules — apply to ALL modes

Get these wrong and data is permanently corrupted or expensive to fix.

**Project setup**
- Never track to production before a separate, verified dev/staging project exists.
- Verify **Simplified ID Merge** is on **before** sending a single event — can't safely change after data exists.
- Set project timezone correctly at creation — can't change retroactively without affecting history.

**Identity**
- Call `.identify(user.id)` on **every** login **and** every app re-open while already logged in.
- Call `.reset()` on **every** logout — skipping it merges the next user's session with the previous one.
- Never use email as `$user_id` — use your DB primary key.
- Never `.identify()` before the user exists in your DB; never `.people.set()` before `.identify()`.
- Track `sign_up_completed` **after** `.identify()`, not before.
- Never merge two `$user_id` values (unsupported in Simplified API — use one stable ID from the start).
- Do not create profiles for anonymous users.

**Data model**
- Never send numeric values as quoted strings (they become non-aggregatable).
- Never build event/property names dynamically at runtime (creates thousands of unique names).
- Never use `$` or `mp_` prefixes on custom names.
- Omit properties with no value — don't send `null` or `""`.
- Case-sensitive: `checkout_completed` ≠ `Checkout_Completed` — enforce snake_case from day one.
- **One event, one meaning** — don't reuse a name for two actions; extend an existing event with a property before creating a new one.
- **Autocapture ⊻ page views** — if `autocapture: true`, do NOT also set `track_pageview: true` or write manual `track('page_viewed')` (duplicates).
- Prefer flat properties; avoid nested objects unless the plan uses list/object types.
- Server + client firing the same event → keep `distinct_id`/identity consistent or you'll corrupt the identity graph.

**Compliance** — unknown consent in a regulated context → don't init non-essential tracking; don't forward IP/sensitive attributes against policy; minimize collection.

**Governance** — no implementation without a signed-off tracking plan (Full mode); **hide** events before dropping (dropping is irreversible); observe a quarter after hiding before dropping.

**Before hard assertions** (plan limits, entitlements, irreversible settings) — verify against current Mixpanel docs and the customer's plan; record what you verified.

---

## Inline SDK snippets (init + track + identify/reset)

Use the platform confirmed in pre-flight. Inject the token from env config, never hard-code. `<CONSENT_GATE>` = only reach init after consent when EU/CA.

**Browser / JavaScript**
```js
import mixpanel from 'mixpanel-browser';
mixpanel.init(process.env.MIXPANEL_TOKEN, {
  // autocapture + page views are mutually exclusive — pick one:
  autocapture: true,          // if true, do NOT set track_pageview and do NOT write manual page_viewed
  // track_pageview: true,    // only if autocapture is false
  // record_sessions_percent: 100,  // Session Replay (dev); set a real % in prod
});
mixpanel.identify(user.id);                 // on login + every re-open while logged in
mixpanel.people.set({ plan: user.plan });   // only AFTER identify
mixpanel.track('sign_up_completed', { method: 'email' });  // AFTER identify
mixpanel.reset();                           // on logout
```

**Node.js (server)**
```js
import Mixpanel from 'mixpanel';
const mp = Mixpanel.init(process.env.MIXPANEL_TOKEN);
mp.track('subscription_upgraded', { distinct_id: user.id, plan: 'pro' });
mp.people.set(user.id, { plan: 'pro' });
```

**Python (server)**
```python
from mixpanel import Mixpanel
mp = Mixpanel(os.environ["MIXPANEL_TOKEN"])
mp.track(user.id, "subscription_upgraded", {"plan": "pro"})
mp.people_set(user.id, {"plan": "pro"})
```

**React Native**
```js
import { Mixpanel } from 'mixpanel-react-native';
const mp = await Mixpanel.init(process.env.MIXPANEL_TOKEN, /*trackAutomaticEvents*/ false);
mp.identify(user.id);
mp.track('value_moment', { source: 'home' });
mp.reset();  // on logout
```

**iOS (Swift)**
```swift
Mixpanel.initialize(token: token, trackAutomaticEvents: false)
Mixpanel.mainInstance().identify(distinctId: user.id)
Mixpanel.mainInstance().track(event: "value_moment", properties: ["source": "home"])
Mixpanel.mainInstance().reset()  // on logout
```

**Android (Kotlin)**
```kotlin
val mp = MixpanelAPI.getInstance(context, token, false)
mp.identify(user.id)
mp.track("value_moment", JSONObject(mapOf("source" to "home")))
mp.reset()  // on logout
```

**HTTP API / warehouse / CDP** — if a CDP (Segment) or warehouse pipeline exists, route events through it instead of installing the SDK directly; keep event names and identity identical to the tracking plan.

---

## Communication habits

- **Concrete over generic** — use the product name, the Value Moment name, and the two real events (`sign_up_completed` + Value Moment) in summaries; use signed-off names in code (no placeholders once defined); refer to the specific files found in pre-flight.
- **Cite docs** — when recommending a Mixpanel capability (Lexicon, super properties, Data Standards, Event Approval, consent pattern, connectors), point to the specific Mixpanel doc so the customer can act on it.

## Close

At the end, confirm: events observed in Live View, identity QA passed, Lexicon updated. Then hand back to **`/14-mixpanel-data-analysis`** to actually read the metric `/16` defined.
