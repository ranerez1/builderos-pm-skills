---
name: 05-create-prd
description: >-
  Synthesizes outputs from skills 01–04 (customer-discovery, pm-planner, cto-planner, ux-planner) into one decision-ready feature PRD (GIFTS outline + requirements, acceptance criteria, rollout, risks). Saves markdown under Outputs/Product PRDs and optionally posts a summary comment to a linked tracker issue via the tracker MCP server configured in Knowledge/workspace-tools.md. Use when the user runs /05-create-prd, asks for a feature PRD after brainstorming, or wants meeting/analysis output consolidated into product requirements.
---

# Create PRD (01–04 → feature PRD)

Turn **brainstorming and analysis from prior steps** into a **single feature-level PRD** that engineering and QA can execute against. If your workspace has a platform-level PRD in `Knowledge/`, do not duplicate it — **trace** feature scope to **POC / MVP / Later** by citing it.

## Role

Act as **staff PM / technical writer**: consolidate, don't invent. Prefer content the user (or chat history) already produced via:

| Step | Skill | Pull into PRD |
| --- | --- | --- |
| **01** | **`01-customer-discovery`** | VOC quotes, themes, severity; candidate problems |
| **02** | **`02-pm-planner`** | Problems → proposed features, **phase** (POC/MVP/Later), KPI hints |
| **03** | **`03-cto-planner`** | Working model, risks & edge cases, build posture, "questions for Product" |
| **04** | **`04-ux-planner`** | IA segment, flows, states, pattern continuity |

If **no** prior outputs exist, infer minimally from the user's brief and **label assumptions**.

## Ground truth (read when relevant)

| Source | Use for |
| --- | --- |
| Product/strategy docs in `Knowledge/` (if present) | People problem vs solution framing, IA vocabulary, trust posture |
| Platform PRD in `Knowledge/` (if present) | Phase gates, personas, non-goals — **cite** MVP vs Later explicitly |
| **`Knowledge/workspace-tools.md`** | Tracker project key, board ID, and tracker MCP server name |
| Tracker ticket conventions in `Knowledge/` (if present) | If posting to the tracker: tone, structure, link style |

## Inputs (minimal; infer from context)

Ask only if blocking:

- **Feature name** and **one-line intent**
- **In / out of scope** (2–5 bullets)
- **Primary user + scenario** (who, when, why)
- **People problem + evidence (required for a strong PRD)**:
  - **People problem**: 1–2 sentences, no solution embedded, not a company KPI
  - **Evidence**: 2–5 bullets (quotes, support, analytics gap, workarounds)
- **Success**: 1–3 measurable signals
- **Constraints**: timeline, dependencies, known risks
- **Alternatives considered**: ≥2 directions + why this one
- *(Optional)* **Tracker issue** URL or key (per your `Knowledge/workspace-tools.md`) to attach a summary comment

Defaults: write for **MVP-safe** slice unless the user insists; **explicit non-goals**; **testable** acceptance criteria.

## Guardrails (avoid solution-led PRDs)

- Separate **problem space** from **solution space**; if the source item is solution-shaped, restate as **people problem + outcome**, keep original wording in **Traceability**.
- Align **non-goals** with any platform-level PRD in `Knowledge/` when the feature touches platform scope.

## PRD structure (mandatory)

Use **bullets over paragraphs**; target **roughly 1–3 pages** of markdown (concise, decision-ready).

```markdown
# PRD: [Feature name]

## TL;DR (GIFTS)
- **Goal (Outcome)**:
- **Insights (Evidence)**:
- **Focus (in-scope / out-of-scope)**:
- **Trade-offs (Option A vs Option B)**:
- **Suggested solution**:
- **Success**:
- **Release shape**:

## Traceability
- **Phase**: POC | MVP | Later — [one-line justification; cite platform PRD if present]
- **Sources consolidated**: 01 customer-discovery / 02 pm-planner / 03 cto-planner / 04 ux-planner — [what was used or "assumed"]

## Context
- Background:
- Why now:
- Constraints / assumptions:

## Goals
- [goal]

## Non-goals
- [non-goal]

## Users & primary use cases
- **Primary user**:
- **Primary scenario**:
- Secondary scenarios:

## Requirements
### Functional requirements
- [FR1] ...

### UX / UI notes (from 04-ux-planner when applicable)
- Screens/states:
- Empty/loading/error states:
- Copy requirements:

### Permissions / roles (if applicable)
- ...

### Data & analytics
- Events to track:
  - `[event_name]` — properties: ...
- Key dashboards / KPIs:

#### Success (quality check)
A good metric should be:
- **Unit of value** (user value, not vanity activity)
- **Truth detector**
- **Actionable**

#### Measuring AI (only if feature is AI-heavy)
Use **AIQ**: Adoption, Impact, Quality (user-perceived).

### Performance & reliability
- ...

### Edge cases (from 03-cto-planner)
- ...

## Acceptance criteria (definition of done)
- [ ] ...

## Rollout plan
- Shipping steps:
- Backward compatibility:
- Feature flag plan (if relevant):

## Risks & mitigations (from 03-cto-planner + product principles)
- ...

## Open questions
- ...
```

## Workflow

1. **Collect** signals from chat and/or pasted outputs from **01–04**; map into the sections above — **do not omit** CTO risks or UX flows if they were produced.
2. **Cross-check** phase and non-goals against any platform PRD in `Knowledge/`.
3. **Write** the PRD markdown file locally (see naming below).
4. **Optional — Tracker**: If the user provided a tracker issue key (e.g. `<TRACKER-KEY>-123`) or URL, use the tracker MCP server named in `Knowledge/workspace-tools.md` to **add a comment** with TL;DR + link to repo path + open questions — **never** create or transition issues unless the user explicitly asks.

### File naming & location

- Directory: **`Outputs/Product PRDs/`** (create if missing).
- Filename: `YYYY-MM-DD_<short-slug>.md`; if a tracker key is known, prefer `YYYY-MM-DD_<TRACKER-KEY>-<n>_<short-slug>.md` (e.g. `2026-06-08_PROJ-123_my-feature.md`).

## Output (to the user)

After `/05-create-prd`:

- Path to the saved markdown file
- If the tracker was updated: issue key + link
- **5–10 bullets**: what ships, how we measure success, top risks

## Collaboration

- Upstream: **`01-customer-discovery`**, **`02-pm-planner`**, **`03-cto-planner`**, **`04-ux-planner`**
- Downstream: **`06-prd-to-tech-plan`** (TDD from this PRD), **`09-pm-reviewer`** (post-ship review)
