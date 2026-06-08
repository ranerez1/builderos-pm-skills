---
name: 06-ui-ux-review
description: Reviews PRD plus UI implementation (screens, flows, copy) using optional Claude browser or screenshots; returns prioritized feedback and fixes. Use for UI/UX review, microcopy review, or /06-ui-ux-review.
---

# UI/UX Review

Provide a **high-signal review** of the **PRD intent** and **what shipped** (UI), with prioritized issues and concrete recommendations.

*(In Cursor, agent browser is the same class of tool.)*

## Inputs

1. **PRD** (path or paste).
2. **Where to look in code** — entry points, routes, feature flags, PR link (brief).
3. **UI evidence (pick one):** **Claude browser** against a URL you provide (local or deployed), **or** screenshots / recording / Figma. Cover important states the PRD mentions (e.g. empty, error, permission) when you can.
4. **Persona, top task, constraints** (time, components, brand) when relevant.

If the feature is UI-heavy and there is no browser access and no screenshots, infer from code and label UI conclusions **inferred**; list **2–4** captures that would confirm them.

## Review lens (use all)

- **Clarity**: does the user understand what to do next?
- **Efficiency**: steps, cognitive load, defaults
- **Error prevention**: validation, confirmations, recoverability
- **States**: empty/loading/error/permissions
- **Accessibility**: keyboard, focus, contrast, semantics
- **Consistency**: component patterns, spacing, naming
- **Microcopy**: labels, helper text, errors, success messages

## Workflow

1. From PRD + code, define **happy path** and **key states**; **compare** to **Claude browser** or screenshots. If no UI evidence, infer and note what to capture.
2. If **Claude browser** is available: walk **critical flows**; grab screenshots as needed; skim console only when it explains a UX defect.
3. Identify the top **3 drop-off risks** (confusion points).
4. Provide feedback grouped by severity (**P0** / **P1** / **P2**). Tie **major** P0/P1 items to the **PRD** where possible (or note “not specified”).
5. **Microcopy pass**: rewrite the most important labels/errors/helper text.
6. Close with a **fix plan** (5–10 bullets, ordered).

## Output (chat)

```markdown
## UI/UX Review: [artifact]

### PRD ↔ implementation
- Requirement / acceptance → what shipped → match | gap | drift
- ...

### Goal & happy path
- Goal:
- Happy path:

### Top risks
1. ...

### Findings
#### P0 (must fix)
- Issue: (PRD ref if any)
  - Why it matters:
  - Recommendation:

#### P1 (should fix)
- ...

#### P2 (nice to have)
- ...

### Microcopy suggestions
- [current] → [recommended]

### Fix plan (ordered)
1. ...
```
