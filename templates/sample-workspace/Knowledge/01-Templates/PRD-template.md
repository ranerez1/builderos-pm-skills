# PRD: [Feature name]

> **Backlog item:** [ITEM-ID] — [Item name]
> **Status:** Draft / In review / Approved / Shipped

---

## TL;DR (GIFTS)

- **Goal:** What outcome are we driving? (user value, not output)
- **Insights:** What evidence tells us this matters? (2-3 bullets max)
- **Focus:** What's in / out of scope in one sentence each
- **Trade-offs:** Option A vs. Option B — why we chose what we chose
- **Suggested solution:** One sentence on what we're building
- **Success:** How we'll know it worked (1-2 measurable signals)
- **Release shape:** MVP / phased / flag / full rollout

---

## Context

- **Background:** Why does this area of the product exist? What state is it in today?
- **Why now:** What changed — feedback spike, competitive gap, strategic shift?
- **Constraints / assumptions:**
  - [e.g. no changes to the data model in this scope]
  - [e.g. must work in both local and Supabase mode]
  - [NEED: any constraints you don't know yet]

---

## Goals

- [Specific, user-facing outcome — not "ship X"]
- [Keep to 2-3 goals max]

## Non-goals

- [Things that might seem in scope but aren't — be explicit]
- [Helps the team say no without a meeting]

---

## Users & primary use cases

- **Primary user:** [Persona name + one-line role description]
- **Primary scenario:** [Who, doing what, when, and why — 2-3 sentences]
- **Secondary scenarios:**
  - [Optional: 1-2 additional valid use cases]

> Tip: Use the personas in `product/Personas/`. If none fit, describe the user in plain terms.

---

## People problem

> This section is required. No solution language — describe the friction or failure the user experiences today.

[1-2 sentences. Everyone should be able to understand it. No mention of what we're building.]

**Evidence:**
- [User quote, support ticket, or review — with source if available]
- [Analytics signal or funnel gap — use [NEED: source] if you don't have it yet]
- [Observed workaround (what users do instead)]
- [Volume signal — how many users, how often]

---

## Requirements

### Functional requirements

- [FR1] [What the system must do — testable, not aspirational]
- [FR2] ...
- [FR3] ...

> Write requirements so an engineer can build from them and a QA can test against them.

### UX / UI notes

- **States:** [List every meaningful state: empty, loading, error, success, edge]
- **Key interactions:** [How users trigger the feature and what happens]
- **Copy requirements:** [Any specific labels, error messages, or empty states that matter]

### Data & analytics

- Events to track:
  - `event_name` - properties: `prop1`, `prop2`
- Key KPIs:
  - [Metric] — baseline: [NEED] — target: [X] by [date]

#### Success check
A good metric should be:
- **Unit of value** — reflects user value, not activity
- **Truth detector** — if it improves, we're genuinely better off
- **Actionable** — the team can influence it

### Performance & reliability

- [Any latency, uptime, or load requirements]
- [What degrades gracefully if something fails]

### Edge cases

- [What happens at the boundary conditions]
- [What the user sees if something goes wrong]

---

## Acceptance criteria (definition of done)

- [ ] [Testable condition 1]
- [ ] [Testable condition 2]
- [ ] [Testable condition 3]
- [ ] Works in local mode (localStorage)
- [ ] Works in cloud mode (Supabase)
- [ ] Mobile layout verified

---

## Rollout plan

- **Shipping steps:** [Any sequencing — e.g. schema migration before deploy]
- **Backward compatibility:** [What happens to existing data / users]
- **Feature flag:** [Yes / No — and when to remove it if yes]

---

## Risks & mitigations

- **[Risk]:** [What could go wrong] — mitigated by [what we're doing about it]
- **[Risk]:** ...

---

## Open questions

- [Question that needs an answer before or during implementation]
- [Owner + deadline if known]

---

> **How to use this template**
> 1. Fill in what you know. Use `[NEED: source]` for gaps — never guess.
> 2. Keep the People Problem section solution-free. If you catch yourself writing "we need to build X," move it to Requirements.
> 3. Target 1-3 pages. If it's longer, the scope is probably too big.
> 4. Get one Engineer, one Designer review before marking Approved.
> 5. Save as `YYYY-MM-DD_ITEM-ID_short-slug.md` in `product/PRDs/`.
