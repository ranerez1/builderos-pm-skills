---
name: 04-ux-planner
description: Produces a UX plan from a problem statement: users, journeys, IA, key screens/states, and UX acceptance criteria. Use when the user asks for a UX plan or runs /04-ux-planner.
---

# UX Planner

Turn a problem into a **design-ready plan**: what to design and how to capture usability and success expectations.

## Inputs (ask only if missing)

- **Feature/initiative**: name + 1–2 lines
- **Primary user** + context of use
- **People problem** + evidence (quotes/support/analytics)
- **Constraints**: platform (web/mobile), accessibility level, brand, deadlines

## Workflow

### 0) Pull in existing workspace context (before asking questions)

Before asking the user for missing inputs, scan for relevant context and reuse it.

- Look for anything relevant in:
  - `Knowledge/`
  - `Learnings/`
  - `Outputs/Planning/<initiative>/` (if initiative is known)
- If initiative planning files exist, **use them as upstream context** (do not summarize; use directly).

### 0.5) Reuse existing initiative planning outputs (when available)

If the initiative name is known and `Outputs/Planning/<initiative>/` exists, load these as upstream context (do not summarize; use directly):

- `pm-high-level.md` and any `pm-high-level_v*.md`
- `tech-high-level.md` and any `tech-high-level_v*.md`
- `design-high-level.md` and any `design-high-level_v*.md`

If multiple versions exist for a role, prefer the **highest `_vN`**; otherwise use the base file.

### 1) Define users and jobs

- Primary persona + JTBD
- Secondary personas (if any)
- Success for the user (not the company)

### 2) Map the journey

- Current flow (happy path + key friction points)
- Proposed flow (steps only; no UI yet)

### 3) Information architecture & content

- Objects/entities users think in (projects, tasks, docs, etc.)
- Key terminology and labels
- Error prevention and recovery

### 4) Screen/state inventory

- Required screens / views
- Required states:
  - empty, loading, error
  - permission denied
  - first-run / onboarding (if needed)

### 5) UX acceptance criteria

- Convert key usability expectations into testable bullets.

## Output (files)

Write a single markdown file to:

- Directory: `Outputs/Planning/<initiative>/`
- File: `design-high-level.md`

### Folder handling

- Ensure `Outputs/Planning/` exists.
- Ensure `Outputs/Planning/<initiative>/` exists (create if missing).

### Existing file handling

- If `design-high-level.md` does **not** exist, create it.
- If `design-high-level.md` **does** exist, ask the user whether to:
  - **Update existing** (overwrite `design-high-level.md`), or
  - **Create new version** (write `design-high-level_vN.md`)

### Version naming (`_vN`)

- Use the next available integer `N` based on files matching `design-high-level_v*.md` in the initiative folder.
- If `design-high-level.md` exists and no versions exist, the first version is `design-high-level_v2.md`.

### File contents

```markdown
## Design High-Level: [initiative]

### Users & jobs
- **Primary user**:
- **JTBD**:
- Secondary users:

### Journey
#### Current flow
1. ...

#### Proposed flow (steps)
1. ...

### IA / content
- Objects & labels:
- Terminology risks:

### Screens & states
- Screens/views:
- States (empty/loading/error/etc.):

### UX acceptance criteria
- [ ] ...
```
