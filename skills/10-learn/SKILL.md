---
name: 10-learn
description: Captures BuilderOS learnings anytime—ship retros (PRD/TDD updates) or process/skill tuning from user and model feedback—and writes durable notes under Learnings/. Use for retro, postmortem, lessons learned, skill improvements, or /10-learn.
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
2. **Identify the implicated skill(s) by slash command / name** (e.g. `/05-create-prd`). BuilderOS skills are installed **read-only** from the plugin (under `~/.claude/plugins/cache/...`, replaced on every update), so you can't edit them in place — capture *what should change*, don't try to patch files.
3. For each implicated skill: write a **concrete** recommendation (new step, input, guardrail, wording) in the learning note.
4. Write **`Learnings/YYYY-MM-DD_<short-slug>.md`** using the full template.
5. **Send it upstream (optional):** offer to file the recommendations as feedback to the plugin author — draft a ready-to-paste issue body, or run `gh issue create` against the plugin repo if the user asks. **Never edit installed plugin files.**

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

## Affected skills
- `/NN-skill-name` (the installed BuilderOS skill this concerns)

## Recommended changes (for the plugin author)
- **Skill:** `/NN-skill-name` — change: ...

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
5. **Mode B:** optionally offer to file the recommendations upstream to the plugin author (ready-to-paste issue or `gh issue create`); never edit installed plugin files.

## Output (to the user)

- Path to **`Learnings/...`**
- Paths of updated PRD/TDD **if** mode A ran
- Mode B: the list of **recommended skill changes** (and the issue link, if one was filed)
- **5–10 bullets** summarizing learnings and follow-ups
