---
name: 17-mixpanel-implementation
description: Guides a coding agent to implement Mixpanel analytics in a codebase — selecting the right SDK, wiring identity/consent/data-model rules, and verifying events land. Four modes: Quick Start, Full Implementation, Add Tracking, Audit. Use when the user wants to implement/set up Mixpanel, add Mixpanel tracking, audit an existing Mixpanel setup, or accepts the handoff from /16-measure-feature.
---

# Mixpanel implementation

**CRITICAL — DO NOT WRITE ANY TRACKING CODE YET.** This skill is a guided conversation, not a build template. Writing Mixpanel code before you have the inputs below produces a broken implementation — wrong SDK, wrong events, missing consent gates, or duplicate data.

## Relation to the other skills

This is the **build** step in the measurement loop:

**`/16-measure-feature` (define what to measure)** → **`/17-mixpanel-implementation` (instrument it)** → **`/14-mixpanel-data-analysis` (read it back)**.

If the user arrived from `/16` with a **Tracking spec handoff**, treat it as the draft tracking plan and still confirm SDK, CDP, and consent below. If they arrived cold, gather the inputs from scratch.

---

## Step 0 — Pre-flight codebase scan

**Do this first, before asking the user anything.** If you have repo access, scan silently and build a draft of the Step 1 inputs from what you find — you will confirm assumptions with the user, not interrogate them from scratch. (No repo access → skip to Step 1 and gather by asking.)

| Read | Extract |
|---|---|
| Routes / controllers / API endpoints | Candidate events (every meaningful user-initiated action) |
| DB models / schema | Candidate properties + types; User Profile fields; Group fields if B2B |
| Auth / session files (login, signup, logout) | Where to place `.identify()`, `.people.set()`, `.reset()`; whether anonymous browsing exists |
| Existing analytics/logging (GA4, Amplitude, Segment, `console.log`) | Draft event names; naming inconsistencies; properties already collected |
| Package files (`package.json`, `requirements.txt`, `build.gradle`, `Package.swift`, `pubspec.yaml`) | Exact stack → SDK selection |
| Env config (`.env`, `config/`, `settings.py`) | Where tokens inject; dev/prod split |

Produce a draft of the Step 1 inputs from what you found; only ask the user to fill genuine gaps.

---

## Step 1 — Confirm inputs (before writing ANY code)

You must have ALL of these before building. Fill each from the pre-flight scan where you can:

1. **Mode** — Quick Start / Full Implementation / Add Tracking / Audit
2. **Platform** — determines the SDK; wrong SDK = full rewrite
3. **CDP?** — if they use Segment (or similar), direct SDK install is wrong; data must route through the CDP
4. **Consent region (EU / California users?)** — if yes, events fired before consent are a compliance violation requiring data deletion
5. **Value Moment** — the single most important user action (from `/16`'s primary metric if handed off)
6. **(Web/JS only) Autocapture and/or Session Replay?** — affects page-view handling (see Critical rules → Data model)

**Ask the user only for inputs the pre-flight scan could not answer** — never assume Platform, CDP, consent region, or Value Moment from the project name. Confirm your inferred inputs explicitly before writing code.

---

## Step 2 — Mode selection

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

## Quick Start flow

Compressed path. **Success = two events live in Mixpanel with basic identity wired in.**

1. **Confirm inputs** — Platform, CDP, Consent region, Value Moment (Step 1 inputs, drafted from pre-flight).
2. **Context** — one-line product summary + the two events you'll ship: `sign_up_completed` and the Value Moment event.
3. **Mini tracking plan** — name both events (snake_case) + 2–4 properties each with types.
4. **Project setup** — create a **dev** project first; verify **Simplified ID Merge** is on and timezone is correct *before* sending anything.
5. **Implement + identity** — install the SDK, init it (snippet below), fire both events, wire `.identify()` on login and `.reset()` on logout.
6. **Verify** — both events landed with correct properties + identity (see **Verification** below).
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
6. **Implementation** — install the SDK, then init + event calls in the codebase; ≥1 event verified in dev (see **Verification**); tracking path (SDK/CDP/warehouse) matches discovery. Autocapture/Session-Replay rules enforced (below).
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
5. **Verify** — correct properties + identity linkage (see **Verification** below).
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

## Implementation mechanics

Before pasting a snippet:

- **Install the SDK** with the project's package manager (`npm i mixpanel-browser`, `pip install mixpanel`, Gradle / SwiftPM / `pubspec.yaml`, etc.) and add it to the manifest — don't assume it's already present.
- **Source the token from env** (`MIXPANEL_TOKEN`); never hard-code.
- **If no token exists**, add a placeholder env var plus a one-line note telling the user to paste their **dev** project token. Never commit a real token.
- Point at the **dev** project token until Verification passes.

---

## Inline SDK snippets (init + track + identify/reset)

Use the platform confirmed in Step 1. The browser snippet shows the consent gate — for EU/CA users, init must not run until consent is granted.

**Browser / JavaScript**
```js
import mixpanel from 'mixpanel-browser';

// EU/CA: init only AFTER consent. Non-regulated: call initMixpanel() directly.
function initMixpanel() {
  mixpanel.init(process.env.MIXPANEL_TOKEN, {
    // autocapture + page views are mutually exclusive — pick one:
    autocapture: true,          // if true, do NOT set track_pageview and do NOT write manual page_viewed
    // track_pageview: true,    // only if autocapture is false
    // record_sessions_percent: 100,  // Session Replay (dev); set a real % in prod
  });
}
if (!requiresConsent || hasUserConsent()) initMixpanel();  // gate before init

mixpanel.identify(user.id);                 // on login + every re-open while logged in
mixpanel.people.set({ plan: user.plan });   // only AFTER identify
mixpanel.track('sign_up_completed', { method: 'email' });  // AFTER identify
mixpanel.reset();                           // on logout
```

**Node.js (server)** — servers must pass `distinct_id` explicitly on every call (no session context):
```js
import Mixpanel from 'mixpanel';
const mp = Mixpanel.init(process.env.MIXPANEL_TOKEN);
mp.track('subscription_upgraded', { distinct_id: user.id, plan: 'pro' });
mp.people.set(user.id, { plan: 'pro' });
```

**Other platforms (Python, React Native, iOS, Android, …)** — same shape (init → identify → track → reset); confirm the current signature against that platform's Mixpanel SDK doc.

**HTTP API / warehouse / CDP** — if a CDP (Segment) or warehouse pipeline exists, route events through it instead of installing the SDK directly; keep event names and identity identical to the tracking plan.

---

## Verification

Every mode's Verify step resolves here. Confirm the event you just fired actually landed with the correct name, properties, and `distinct_id` — and confirm identity linkage.

- **MCP first.** Resolve the Analytics MCP from `Knowledge/workspace-tools.md` → **Analytics** → `MCP Server` (the same source `/14-mixpanel-data-analysis` uses). If configured, verify by **querying the dev project** for the event programmatically.
- **Live View fallback.** If no Analytics MCP is configured, confirm the event in Mixpanel **Live View**.
- Trigger the event path in dev where you can (run/exercise the flow) rather than assuming the call fires.

---

## Communication habits

- **Concrete over generic** — use the product name, the Value Moment name, and the two real events (`sign_up_completed` + Value Moment) in summaries; use signed-off names in code (no placeholders once defined); refer to the specific files found in pre-flight.
- **Cite docs** — when recommending a Mixpanel capability (Lexicon, super properties, Data Standards, Event Approval, consent pattern, connectors), point to the specific Mixpanel doc so the user can act on it.

## Close

At the end, confirm: events verified (MCP or Live View), identity QA passed, Lexicon updated. Then hand back to **`/14-mixpanel-data-analysis`** to actually read the metric `/16` defined.
