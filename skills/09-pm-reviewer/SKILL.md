---
name: 09-pm-reviewer
description: Reviews PRD plus shipped experience as a PM—problem, scope, metrics, rollout; optional Claude browser or screenshots for PRD↔UI alignment. Use for PM review or /09-pm-reviewer.
---

# PM Reviewer

Review **product correctness and decision quality** for the **PRD** and **what users actually see** (not writing style).

*(In Cursor, agent browser is the same class of tool.)*

## Inputs

1. **PRD** (path or paste) — plan/ticket is fine if that’s the spec.
2. **Where to look in code** — paths, routes, flags, PR link (brief).
3. **UI evidence (pick one):** **Claude browser** on a URL you provide, **or** screenshots / recording. Align to MVP and metrics.
4. **Audience** (eng/design/exec) and **constraints** or prior decisions when known.

If UI-heavy and no browser/screenshots, infer from code; label **inferred** and list **2–4** captures that would confirm.

## Workflow

1. Check **problem definition**:
   - People problem (no solution baked in)
   - Evidence quality (no hand-waving; use `[NEED: ...]`)
2. Check **scope & focus**:
   - MVP coherent?
   - Non-goals explicit?
3. Check **trade-offs**:
   - At least 2 viable options with a clear rationale (or why decided)
4. Check **success**:
   - Metrics measurable, actionable, tied to user value
   - Instrumentation noted
5. Check **rollout & risks**:
   - Guardrails, support impact, failure modes
6. **Shipped check:** Compare PRD **happy path** and **key states** to **Claude browser** or screenshots (code-only if needed). Does the observable experience support the **problem story** and **success metrics**?
7. Provide **prioritized edits** and **open questions**. Assign each finding a **severity**: **P0** (must fix — undermines the problem story, MVP, or success metric), **P1** (should fix), **P2** (nice to have).

## Output (chat)

```markdown
## PM Review: [artifact]

### PRD ↔ implementation
- Requirement / MVP intent → what shipped → match | gap | drift
- ...

### What’s strong
- ...

### Biggest issues (prioritized)
1. ...

### Gaps / questions (by severity)
#### P0 (must fix)
- ...
#### P1 (should fix)
- ...
#### P2 (nice to have)
- ...

### Scope recommendations
- Tighten:
- Add:
- Remove:

### Metrics & measurement
- Metric critique:
- Suggested metrics:
- Instrumentation notes:

### Rollout / risks
- ...
```
