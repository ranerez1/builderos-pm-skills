---
name: 06-prd-to-tech-plan
description: Converts a PRD into a build-ready Technical Design Doc (TDD) and saves it under Outputs/Technical Docs. Use when the user wants to turn a PRD into an implementation plan, or runs /06-prd-to-tech-plan.
---

# PRD → Technical Plan (Technical Design Doc)

Create a **feature Technical Design Doc** (TDD) that is concise, implementation-ready, and easy to maintain.

Always:

- Write the doc to `Outputs/Technical Docs/`
- Prefer **bullets** and **tables** over long prose
- Make decisions explicit (what we’re doing + what we’re not doing)
- Include a short **execution plan** (phases + milestones)

## Inputs (minimal; infer from repo context when possible)

Gather (ask only if missing):

- **Feature name**
- **Mode**:
  - **Pre-build**: planning & alignment before implementation
  - **Post-build**: documentation of what shipped (and deltas vs the plan)
- **Scope**: in / out (2–8 bullets)
- **Constraints**: timeline, backwards-compat, dependencies, compliance/security, infra limits
- **Success signal**: how we’ll know it worked (1–3 measurable signals)
- **Codebase context** _(optional)_: path(s) to the relevant repo(s)/modules/services.
  - If **provided or detectable** (workspace is a repo): ground decisions in existing patterns and cite real modules/files in the TDD.
  - If **absent** (new project / no repo yet): proceed with explicit assumptions and capture them under **Open questions**; mark the TDD as _New project_ in **Status**.

Defaults when unclear:

- Optimize for **safe incremental delivery**
- Prefer **feature flags** when rollout risk is non-trivial
- Prefer **observability** (logs/metrics/traces) over “we’ll debug later”

## Output file

### Folder

- `Outputs/Technical Docs/`

### File name

Save as:

- `Outputs/Technical Docs/YYYY-MM-DD_<short-slug>.md`

Where `<short-slug>` is a 3–10 word kebab-case slug from the feature name.

If a ticket/board id exists, include it:

- `Outputs/Technical Docs/YYYY-MM-DD_<ticketId>_<short-slug>.md`

## Document structure (use this template)

Write the doc using this exact structure (omit sections only if truly irrelevant):

```markdown
# TDD: [Feature name]

## TL;DR
- **Problem**:
- **Proposal**:
- **Key decisions**:
- **Risks**:
- **Plan**:

## Status
- **Mode**: Pre-build | Post-build
- **Codebase**: Existing codebase | New project
- **Owner**:
- **Last updated**: YYYY-MM-DD

## Goals
- ...

## Non-goals
- ...

## Scope
### In
- ...

### Out
- ...

## Current state (baseline)
- What exists today: <!-- or "New project: no existing codebase; assumed stack = …" -->
- Constraints / sharp edges:
- Relevant modules/files: <!-- omit or write "N/A (new project)" if no repo -->

## Proposed solution
### High-level approach
- ...

### Architecture / components
- Component A:
- Component B:

### Data model / schema changes (if any)
- Entities / fields:
- Migrations:
- Backward compatibility:

### APIs / contracts (if any)
- Endpoints / payloads:
- Versioning strategy:
- Error model:

### UX / user flows (if applicable)
- Primary flow:
- Empty/loading/error states:

### Authorization / security (if applicable)
- Authn/authz checks:
- Data access rules:
- Threats & mitigations:

### Performance / reliability
- Expected load:
- Latency / throughput targets:
- Failure modes + retries/timeouts:
- Rate limiting / caching:

### Observability
- Logs:
- Metrics:
- Traces:
- Alerts:

## Alternatives considered
- Option 1: ...
  - Pros:
  - Cons:
  - Why not:
- Option 2: ...

## Rollout plan
- Feature flag plan:
- Migration rollout (if any):
- Staged rollout:
- Rollback strategy:

## Test plan
- Unit:
- Integration:
- E2E:
- Manual checks:

## Execution plan
Break into small, shippable slices.

- Phase 0 (prep): ...
- Phase 1 (MVP): ...
- Phase 2 (hardening): ...

## Open questions
- ...

## Appendix (post-build only)
### What shipped (delta vs plan)
- ...

### Links
- PRs:
- Issues/tickets:
- Dashboards:
```

## Workflow

### 1) Determine mode (pre-build vs post-build)

- If the user is about to build: **Pre-build**.
- If the feature already shipped or is being documented: **Post-build** and include the **Appendix** section.

### 2) Read the repo enough to be correct (if a codebase is available)

**If a codebase is available**, do lightweight investigation to avoid hand-wavy design:

- Identify the likely touched packages/modules
- Identify existing patterns to follow (config, logging, errors, auth, API style)
- If migrations or public contracts are involved, locate the existing migration/contract conventions
- Cite concrete file paths in **Current state (baseline) → Relevant modules/files**

**If no codebase is available** (new project):

- Skip repo investigation; do **not** invent file paths or modules
- State the assumed tech stack/architecture explicitly in **Current state (baseline) → What exists today** (e.g., "New project: assumed stack is …")
- Move all stack/architecture choices that depend on existing code into **Open questions**

### 3) Write the TDD

- Keep it **~1–3 pages** (roughly 120–350 lines)
- Prefer concrete choices: names, boundaries, contracts, constraints
- Ensure the plan is “buildable”: someone could implement from this doc

### 4) Save the file

- Create `Outputs/Technical Docs/` if missing
- Write the markdown file using the naming convention above

### 5) Post-build refresh (when mode is Post-build)

Update the doc to reflect reality:

- What changed and why
- Final decisions (including reversals)
- Final rollout outcome (if known) and any follow-ups

## Output (to the user)

After running this skill, return:

- The created file path (under `Outputs/Technical Docs/`)
- A 5–10 bullet summary of the key decisions + risks
