---
name: 16-measure-feature
description: Proposes how to measure a new or existing product feature — frames it on the Reach → Adoption → Outcome → Impact ladder, picks a primary outcome metric plus supporting metrics and guardrails, then stress-tests the primary metric with the 3-ingredient evaluation (unit of value, truth detector, actionable). Runs standalone; optionally hands the resulting events off to /17-mixpanel-implementation to instrument. Use when the user asks how to measure a feature, what metric to track, wants to define/critique a success metric, or runs /16-measure-feature.
---

# Measure feature

Propose how to measure a **new or existing product feature**, then stress-test the primary metric with the **3-ingredient evaluation**. Runs standalone; once the metric is solid, it can optionally hand the events off to **`/17-mixpanel-implementation`** to actually instrument.

---

## Route first

| User provided | Path |
|---------------|------|
| Feature description | Phases 1–4 |
| Metric + context, no feature to propose | **Phase 4 only** — collect metric, context, goal; use metric-only output template |
| Unclear | Ask 1–2 clarifying questions |

---

## Phase 1 — Discovery

Ask only for missing inputs:

1. **Feature** — name, what it does, new vs existing, what "working" looks like
2. **User & problem** — who uses it, job-to-be-done, who *should* use it
3. **Product context** — mission and NSM if known (`[NEED: NSM]` if unknown)
4. **Feature stage** — idea / building / shipped
5. **Eligible population** — who *can* use it (denominator for reach/adoption/outcome)

---

## Phase 2 — Frame the feature

### Outcome ladder (primary frame)

**Primary metric lives on Outcome**, not Reach or Adoption.

| Rung | Question | Metric role |
|------|----------|-------------|
| **Reach** | Did the intended segment encounter the feature? | Eligible reach rate |
| **Adoption** | Did they try it? | First-use rate (eligible denominator) |
| **Outcome** | Did it produce the intended behavior change? | **Primary metric** |
| **Business impact** | Did that move a product-level outcome? | Lagging: retention lift, NSM contribution |

### NSM link

Classify **Attention** (time spent), **Transaction** (transactions made), or **Productivity** (work done efficiently) + one-sentence causal link to NSM.

**Constraints:**

- Max **1 primary + 2–3 supporting + 1–2 guardrails**
- Customer-value oriented primary — not MRR/DAU alone
- Eligible population as denominator — not total MAU/DAU when segment is narrower
- Qualitative complement (interview prompt, CSAT/CES trigger)
- **Idea stage:** proxies + qualitative only — skip guardrails, baseline, attribution

---

## Phase 3 — Propose measurement plan

1. **Primary (outcome rung)** — name, definition, formula, owner, feedback-loop speed
2. **Supporting** (2–3 max) — mapped to Reach, Adoption, or Outcome; if multi-step, include funnel steps here
3. **Guardrails** (1–2, **building/shipped only**) — must not worsen; baseline, threshold, risk (quality / retention / ecosystem), action if violated
4. **Business impact (lagging)** — product-level metric + expected direction
5. **Baseline and targets** (**building/shipped only**) — baseline (`[NEED]` if unknown), 30d target, 90d target (shipped/retention), review dates booked before launch
6. **Attribution** (shipped) — A/B, pre-post cohort, or diff-in-diff
7. **Instrumentation** — events and key properties
8. **Tree placement** — L2/L3 under parent metric (one line)

---

## Phase 4 — Evaluate primary metric (3-ingredient framework)

**Full path:** always run on proposed primary (outcome rung) after Phase 3.  
**Metric-only path:** collect metric, context, goal first.

### 1. Unit of value

Reflects what users *do* or *get* — real value, not presence.

**Check:** meaningful behavior? On **Outcome** rung, not Reach/Adoption?

**Common failures:** logins/visits; "clicked feature" as primary; feature availability as proxy.

### 2. Truth detector

Moves with quality; resists gaming.

**Check:** unambiguous direction? Gameable without UX improvement? **Denominator** uses eligible population?

**Common failures:** raw counts; `% of all WAU` when only a subset is eligible.

### 3. Actionable

Team can move it in days–weeks with levers they control.

**Common failures:** revenue/retention as sole team KPI; owned elsewhere.

### Ratings

PASS / WEAK / FAIL per ingredient (2–3 sentence rationale).

| Verdict | When |
|---------|------|
| **STRONG** | All three PASS |
| **NEEDS WORK** | One or two WEAK, fixable |
| **REPLACE IT** | Any FAIL, or two+ WEAK |

Prefer a **concrete alternative** (name + formula). If **REPLACE IT**, revise primary metric before finalizing.

---

## Phase 5 — Implementation handoff (optional)

Once the primary metric is **STRONG** (or fixed after a REPLACE IT), the events in the `Instrumentation` line are only useful if they actually get tracked. **Ask the user:**

> "Do you want me to turn this into a Mixpanel tracking implementation plan?"

- **No** → stop here. The measurement plan is the deliverable.
- **Yes** → emit the **Tracking spec handoff** below, then invoke **`/17-mixpanel-implementation`** to instrument it. Do **not** start writing tracking code from this skill — 17 owns SDK choice, identity, consent gating, and verification.

Only propose the handoff when the feature is **building** or **shipped** (idea-stage features have nothing to instrument yet).

### Tracking spec handoff (feed into `/17-mixpanel-implementation`)

```text
TRACKING SPEC (from /16-measure-feature)
Feature: [name]
Primary metric: [name] = [formula]   ← every event/property below must make this computable

Events (snake_case):
- [event_name] — fires when [trigger]
    props: [prop_name: type, ...]     (flat, snake_case; no $/mp_ prefixes)
- [event_name] — fires when [trigger]
    props: [prop_name: type, ...]

Identity touchpoints: [where user is known vs anonymous; login/logout handlers if known]
Eligible-population signal: [property/segment that defines the denominator]
Supporting/guardrail events: [any extra events the plan needs]
```

Downstream loop: **/16 (define)** → **/17-mixpanel-implementation (instrument)** → **/14-mixpanel-data-analysis (read it back)**.

---

## Output template (full path)

```text
FEATURE: [name]
STAGE: [idea | building | shipped]
CONTEXT: [product / users / problem]
ELIGIBLE POPULATION: [denominator definition]

FRAME
Outcome ladder:
  Reach: [metric or N/A]
  Adoption: [metric or N/A]
  Outcome (primary): [metric]
NSM link: [game + causal sentence]

MEASUREMENT PLAN
Primary (outcome rung): [name] — [formula] — [owner] — [loop speed]
Supporting: [ladder rung + metric; funnel steps if multi-step]
Guardrails: [1–2 — baseline, threshold, risk, action]  [skip if idea]
Business impact (lagging): [product metric + direction]
Baseline / 30d / 90d targets / review dates  [skip if idea]
Attribution: [method or N/A]
Qualitative: [trigger]
Instrumentation: [events + properties]
Tree placement: L2/L3 under [parent]

PRIMARY METRIC EVALUATION (3-ingredient)

INGREDIENT 1 — UNIT OF VALUE: [PASS / WEAK / FAIL]
[2–3 sentences]

INGREDIENT 2 — TRUTH DETECTOR: [PASS / WEAK / FAIL]
[2–3 sentences incl. denominator check]

INGREDIENT 3 — ACTIONABLE: [PASS / WEAK / FAIL]
[2–3 sentences]

OVERALL VERDICT: [STRONG / NEEDS WORK / REPLACE IT]

WHAT'S BROKEN:
- [specific problems]

SUGGESTED FIX:
[Revised metric if needed. Include formula.]
```

## Output template (metric-only path)

```text
METRIC: [metric name]
CONTEXT: [product / team / goal]

INGREDIENT 1 — UNIT OF VALUE: [PASS / WEAK / FAIL]
[2–3 sentences]

INGREDIENT 2 — TRUTH DETECTOR: [PASS / WEAK / FAIL]
[2–3 sentences]

INGREDIENT 3 — ACTIONABLE: [PASS / WEAK / FAIL]
[2–3 sentences]

OVERALL VERDICT: [STRONG / NEEDS WORK / REPLACE IT]

WHAT'S BROKEN:
- [specific problems]

SUGGESTED FIX:
[Revised metric or modification. Include formula where useful.]
```
