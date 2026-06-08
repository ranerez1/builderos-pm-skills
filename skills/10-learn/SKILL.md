---
name: 09-learn
description: Captures BuilderOS learnings anytime—ship retros (PRD/TDD updates) or process/skill tuning from user and model feedback—and writes durable notes under Learnings/. Use for retro, postmortem, lessons learned, skill improvements, or /09-learn.
---

# Learn (retro + continuous improvement)

Make BuilderOS **better every iteration**: capture what happened, why, and what to change—in **product docs**, **technical docs**, **Learnings notes**, and optionally **other skills/commands**.

Prefer being **specific and actionable** over being exhaustive.

## Modes (pick one per run; infer from context)

### A) Ship retro

When the user ties the session to **shipped / reverted / partially shipped** work: update **PRD** + **TDD** (as below) and always write **`Learnings/YYYY-MM-DD_<short-slug>.md`**.

If the session also exposed **skill or process** gaps, add the **Process / skill improvement** sections to the **same** learning file (type: `mixed`).

### B) Process / skill improvement

When there is **no** ship context (bad chat, wrong tool use, missed rule, user critique, repeated corrections): **do not** invent product intent or force PRD/TDD edits.

1. Classify **explicit** user feedback vs **implicit** signals (misunderstandings, tool errors, plan drift, avoidable retries).
2. **Inventory relevant skills:** paths the user named plus implicated `.cursor/skills/**/SKILL.md` (and matching `.claude/commands/*.md`)—use **lightweight** search/read; do not rewrite every skill.
3. For each implicated file: **concrete** recommendations (new step, input, guardrail, wording).
4. Write **`Learnings/YYYY-MM-DD_<short-slug>.md`** using the full template.
5. **Apply** changes to skills/commands **only if** the user explicitly asks to **apply** in the **same** run. Otherwise recommendations live in chat + the learning note only.

When applying: follow **skills sync**—any change under `.cursor/skills/**/SKILL.md` that has a numbered command must update the matching **self-contained** `.claude/commands/<same-name>.md` (no links to `.cursor/skills/...` in the command body).

## Inputs (minimal; infer when possible)

**Always useful**

- What to capture (one line).
- **Date** (default: today).

**Ship retro (ask only if missing)**

- **Work item** name
- **Identifier(s)**: ticket id, PR, commit, doc slugs
- **Outcome**: shipped / reverted / partially shipped
- **Scope delta** vs plan
- **Timeline** (rough)

**Process / skill improvement**

- What went wrong or what to improve
- Which skills/commands were involved (optional if inferable)

## Find the relevant docs (ship retro only)

### PRD

- `Outputs/Product PRDs/*<ticketId>*` or match by feature slug  
- If none: do **not** invent intent; add `Outputs/Product PRDs/YYYY-MM-DD_<ticketId?>_<short-slug>_retro-addendum.md`

### TDD

- `Outputs/Technical Docs/*<ticketId>*` or match by slug  
- If none: create `Outputs/Technical Docs/YYYY-MM-DD_<ticketId?>_<short-slug>.md` in **Post-build** style

## Update rules (ship retro; keep diffs small)

- Prefer **appending** dated sections.
- Document **delta and why** when reality diverged from the plan.

### PRD retro block

```markdown
## Retro (YYYY-MM-DD)
- **What shipped**:
- **What didn’t ship (and why)**:
- **User impact observed**:
- **Metrics / success signals**:
- **Follow-ups**:
```

### TDD retro block

```markdown
## Retro (YYYY-MM-DD)
### Delta vs plan
- ...
### Incidents / surprises
- ...
### Decisions that paid off
- ...
### Decisions we’d change next time
- ...
### Operational notes
- Observability gaps:
- Runbook updates needed:
```

## Learnings file (always for this command)

**Path:** `Learnings/YYYY-MM-DD_<short-slug>.md` (create `Learnings/` if missing).

**Template:**

```markdown
# Learning: [short title]

## Context
- **Work item** (or session topic):
- **Date**: YYYY-MM-DD
- **Type**: feature | bugfix | refactor | infra | process | skill-tuning | mixed
- **Stack area**: (if relevant)
- **Links**: PRs, docs, chats, dashboards

## Explicit feedback (user)
- Quotes or faithful paraphrase

## Implicit signals / model–tool failures
- Wrong assumptions, missed rules, tool errors, approval friction, plan drift

## Affected skills / commands
- `path/to/SKILL.md` or `.claude/commands/....md`

## Recommended changes (do not apply unless user requested apply in this run)
- **File:** `...` — change: ...

## Ship retro (if mode A or mixed)
### What went well
- ...
### What went poorly
- ...
### Root causes (if relevant)
- ...
### Changes we’ll make next time
- ...

## Checklists / heuristics
- If [condition], then [do this].
- Prefer [pattern] over [anti-pattern] because [reason].
```

**Guidelines**

- At least **one** concrete checklist line.
- Record **trigger** and **early signal** for painful failures.
- No names/blame; systems and process only.

## Workflow (summary)

1. Choose **mode A** and/or **B**; compute `<short-slug>`.
2. **Mode A:** locate/update PRD + TDD; append retro blocks.
3. **Mode B (or mixed):** classify feedback; list implicated skills; write recommendations.
4. Write **`Learnings/...md`** (full template; omit sections that truly don’t apply).
5. If user said **apply**: patch skills + mirror commands per sync rule; summarize diffs.

## Output (to the user)

- Path to **`Learnings/...`**
- Paths of updated PRD/TDD **if** mode A ran
- If recommendations only: list **recommended** file edits; if applied: note **what changed**
- **5–10 bullets** summarizing learnings and follow-ups
