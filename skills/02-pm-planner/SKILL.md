---
name: 02-pm-planner
description: Translates discovery outputs into 2-3 candidate initiatives, then creates a focused kickoff one-pager for the selected initiative. Use when the user wants to turn discovery into an initiative direction or runs /02-pm-planner.
---

# PM Planner (problem → candidate initiatives → kickoff one-pager)

Turn an unstructured problem space into **2–3 initiative candidates**, then a focused **Feature Kickoff One-Pager** for the selected initiative.

This is a **problem-to-initiative planning tool**: start with messy inputs (observations, complaints, hypotheses), propose **2–3 potential initiatives**, then write a focused **Feature Kickoff One-Pager** only for the selected initiative.

It is **not a full PRD**. The goal is to help a PM transition from **problem space → selected direction**, align with design/engineering, and only then write a full PRD.

## Inputs (ask only if missing)

- **Starting point**: what do we know so far? (notes, doc, snippet, or 3–8 bullets)
- **Optional working title**: feature/initiative name + 1–2 lines (if already decided)
- **Target user + scenario** (who, when, why)
- **People problem + evidence** (required; 2–5 bullets, use `[NEED: ...]` for gaps)
- **Constraints**: timing, platform, dependencies, compliance, stakeholders
- **Baseline + success**: current state + 1–2 measurable success signals (keep light; detailed metrics come only after direction is selected)

## Workflow

### 0) Pull in existing workspace knowledge (before asking questions)

Before asking the user for missing inputs, scan for relevant context and reuse it.

- Look for anything relevant in:
  - `Knowledge/02-Product-Knowledge/`
  - `Knowledge/03-Market-Knowledge/`
  - `Knowledge/04-ICP/`
  - `Learnings/`
  - `Outputs/Discovery/`
- Extract and cite the **highest-signal facts** (problem evidence, ICP details, constraints, competitive notes, prior decisions, metrics baselines).
- If these folders are empty or not relevant, proceed without them (don’t fabricate).

### 0.5) Reuse existing initiative planning outputs (when available)

If the initiative name is known and `Outputs/Planning/<initiative>/` exists, load these as upstream context (do not summarize; use directly):

- `pm-high-level.md` and any `pm-high-level_v*.md`
- `design-high-level.md` and any `design-high-level_v*.md`
- `tech-high-level.md` and any `tech-high-level_v*.md`

If multiple versions exist for a role, prefer the **highest `_vN`**; otherwise use the base file.

### 1) Clarify the problem (no solution yet)

- Translate any solution-y wording into:
  - **People Problem** (1–2 sentences)
  - **Desired outcome** (1 sentence)
- List **assumptions** explicitly and mark unknowns with `[NEED: ...]`.
- **Evidence bar**: if the problem or evidence is thin (mostly hypotheses, no user signals, heavy `[NEED: ...]`), say so explicitly. In Step 3, at least one of the 2–3 candidates must be a **discovery / validation initiative** (e.g. interviews, prototype tests, data pulls) aimed at strengthening the problem—not only “build the feature” options.

### 2) Define the decision you need

- What decision do we need from the team? (which initiative to pursue, MVP shape, sequencing, trade-offs)
- What “must be true” for this to succeed?

### 3) Propose initiative candidates + recommended shape

- Propose **2–3 initiative candidates** (distinct ways to address the problem or reduce uncertainty about it).
- When evidence is weak, include a **discovery-first candidate** alongside any build candidates; do not pretend the solution space is settled.
- For each candidate, include:
  - **One-liner** (what it is)
  - **Who / when**
  - **Why it works** (the mechanism)
  - **Key trade-off**
- End with a **recommendation** (which candidate + why + what must be true).

Use this concise format:

```markdown
## Potential initiative candidates

### Candidate A: [name]
- **One-liner**:
- **Who / when**:
- **Why it could work**:
- **Main trade-off**:

### Candidate B: [name]
- **One-liner**:
- **Who / when**:
- **Why it could work**:
- **Main trade-off**:

### Candidate C: [name] (optional)
- **One-liner**:
- **Who / when**:
- **Why it could work**:
- **Main trade-off**:

### Recommendation
- **Recommended candidate**:
- **Why**:
- **What must be true**:
```

### 4) Confirm selected initiative (checkpoint)

- **Stop here unless the user has already selected a candidate.**
- Ask the user to select one candidate, combine candidates, or adjust the recommendation.
- Do **not** write `pm-high-level.md` until there is a selected initiative.
- If the user already selected the initiative in the original request, state the selected initiative and continue to the kickoff one-pager.

### 5) Write the focused kickoff one-pager

- Write only for the **selected initiative**.
- Do not re-list all candidate options in `pm-high-level.md`.
- Keep it focused enough to read like a kickoff one-pager:
  - Target **900–1,200 words max**.
  - No section should exceed **5 bullets** unless the user explicitly asks for depth.
  - Prefer clear paragraphs and crisp numbered capability lists over broad planning tables.
- Include `[NEED: ...]` for missing objectives, baselines, links, or evidence instead of inventing specifics.

### 6) Optional deeper planning

- Keep prioritization scores, detailed milestones, instrumentation plans, and deep risk analysis **out of the main one-pager** by default.
- If the user asks for them, provide them as chat-only notes, an appendix, or a separate planning artifact such as `pm-candidates.md` / `pm-planning-notes.md`.

## Output (files)

Write a single markdown file to:

- Directory: `Outputs/Planning/<initiative>/`
- File: `pm-high-level.md`

### Folder handling

- Ensure `Outputs/Planning/` exists.
- Ensure `Outputs/Planning/<initiative>/` exists (create if missing).

### Existing file handling

- If `pm-high-level.md` does **not** exist, create it.
- If `pm-high-level.md` **does** exist, ask the user whether to:
  - **Update existing** (overwrite `pm-high-level.md`), or
  - **Create new version** (write `pm-high-level_vN.md`)

### Version naming (`_vN`)

- Use the next available integer `N` based on files matching `pm-high-level_v*.md` in the initiative folder.
- If `pm-high-level.md` exists and no versions exist, the first version is `pm-high-level_v2.md`.

### File contents

Use this template for the selected initiative only:

```markdown
# Feature Kickoff One-Pager - [Feature / Initiative]

## What problem are we trying to solve?

[One short paragraph describing the user pain, where it shows up, and why it matters.]

- **Evidence**: [2–3 highest-signal proof points, quotes, counts, or refs]
- **Current workaround(s)**: [how users solve or avoid this today]

**The main problem we are focused on:** [one sentence]

## What is our motivation and expectation?

[One short paragraph connecting the problem to product/business motivation.]

- **Objective / KR**: [known objective or `[NEED: Objective/KR]`]
- **Expected impact**: [measurable hypothesis, not a guaranteed result]
- **Success signal**: [1 primary signal + 1 optional supporting signal]

## What is the feature? High-level overview

1. [MVP capability 1]
2. [MVP capability 2]
3. [MVP capability 3]
4. [Optional MVP capability 4]
5. [Optional MVP capability 5]

[Optional: mock/prototype link if available.]

## Why would this fail?

1. [Adoption / behavior-change failure mode]
2. [Trust, privacy, or comfort failure mode]
3. [Discoverability / competing-workflow failure mode]
4. [Scope, complexity, or product-positioning failure mode]
5. [Measurement or rollout failure mode]

## Decisions needed before PRD

1. ...
```
