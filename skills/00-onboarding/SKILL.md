---
name: 00-onboarding
description: Interactive first-time setup for BuilderOS PM Skills — bootstraps the workspace, fills CLAUDE.md and Knowledge/workspace-tools.md conversationally (including Knowledge Sources for /12-ingest-knowledge), explains installed skills, and recommends the clearest next step. Use when the user runs /00-onboarding, asks to get started with BuilderOS, or has unfilled workspace templates after plugin install.
disable-model-invocation: true
---

# BuilderOS Onboarding

Walk a PM through **post-install workspace setup** so they finish with:

1. A clear mental model of what skills they have and where files live
2. `CLAUDE.md` and `Knowledge/workspace-tools.md` filled for their product and company
3. Awareness of all 13 workflow skills and which to run first
4. A saved summary at `Knowledge/onboarding-summary.md` with a personalized next step

**Assumes:** the `builderos-pm-skills` plugin is already installed. Do not walk through `claude plugin install`.

## Tone and pacing

- Friendly, plain language — assume the user is a PM, not a CLI expert
- **One phase at a time.** Confirm before advancing.
- **Progress header is mandatory** at the start of every phase message (see Progress display below); phase explanation follows it
- Ask **1–3 questions per turn**, never a wall of questions
- Show a **short preview** of file changes before writing
- Never fabricate company data — use `[NEED: ...]` for skipped fields
- If the user already has partially filled files, **merge** (replace placeholders only; preserve custom content)
- Use emoji sparingly in progress UI: ✅ done, 🔵 current step, ○ pending

## Progress display (show every phase)

Claude Code has no native progress-bar API. Show progress **in chat** at the start of every phase message (and immediately on resume). Keep the block to **7 lines max**.

### Phase order and labels

| Step | `phase` value | Display label |
|------|---------------|---------------|
| 1 | `welcome` | Welcome |
| 2 | `workspace` | Workspace |
| 3 | `claude_md` | Your product context |
| 4 | `tools` | Your tools |
| 5 | `mcp` | MCP check |
| 6 | `tour` | Skills tour |
| 7 | `finish` | Finish |

### How to build the header

1. Read `Knowledge/onboarding-state.json` (or assume step 1 if missing / starting fresh).
2. Mark completed phases `[x]`, current phase with `← *you are here*`, pending as `[ ]`.
3. Print **Template A (default)** — checkbox list:

```markdown
**BuilderOS setup — step <N> of 7**

- [x] Welcome
- [x] Workspace
- [ ] Your product context  ← *you are here*
- [ ] Your tools
- [ ] MCP check
- [ ] Skills tour
- [ ] Finish
```

4. **Template B (fallback)** if checkboxes look noisy on CLI — compact emoji rail:

```markdown
**Setup:** ✅ Welcome · ✅ Workspace · 🔵 Context · ○ Tools · ○ MCP · ○ Tour · ○ Done
*Step 3 of 7*
```

5. On **complete** (`finish` done): all `[x]`, then `**Setup complete**` — no "you are here" line.

### Persist progress to disk

After printing the header (and whenever `onboarding-state.json` changes), write the same checklist to `Knowledge/onboarding-progress.md` so desktop users can pin it in the file pane. On completion, add `Status: complete` at the top and keep the file as a reference.

## Resume support

On start, check `Knowledge/onboarding-state.json`:

```json
{
  "phase": "tools",
  "completed": ["welcome", "workspace", "claude_md"],
  "startedAt": "2026-06-08",
  "complete": false
}
```

- If present and `complete` is not `true`: offer **resume** (continue from `phase`) or **start fresh** (delete state and restart)
- On **resume**, print the progress header **immediately** before asking resume vs fresh
- After each phase completes, update the state file and `Knowledge/onboarding-progress.md`
- When onboarding finishes, set `"complete": true` and keep the file for reference

Valid `phase` values (in order): `welcome` → `workspace` → `claude_md` → `tools` → `mcp` → `tour` → `finish`

## Installed skills reference

Use this table when explaining what the user has. Skills 01–13 ship with the plugin; this skill is `00`.

| # | Slash command | What it does |
|---|---------------|--------------|
| 01 | `/01-customer-discovery` | Synthesize customer feedback into top user-problem trends. Read-only. |
| 02 | `/02-pm-planner` | Turn problem space into 2–3 initiative candidates, then a kickoff one-pager. |
| 03 | `/03-cto-planner` | Stress-test an initiative against the codebase; surface gaps before a TDD. |
| 04 | `/04-ux-planner` | UX plan: users, journeys, IA, key screens/states, UX acceptance criteria. |
| 05 | `/05-create-prd` | Consolidate 01–04 into a decision-ready feature PRD; saves to `Outputs/Product PRDs/`. |
| 06 | `/06-prd-to-tech-plan` | PRD → implementation-ready Technical Design Doc in `Outputs/Technical Docs/`. |
| 07 | `/07-ui-ux-review` | Review PRD + UI; prioritized feedback and fixes. |
| 08 | `/08-rnd-reviewer` | Senior-engineer review of PRD/TDD + implementation. |
| 09 | `/09-pm-reviewer` | PM review of PRD + shipped experience. |
| 10 | `/10-learn` | Ship retro and/or process improvements; writes to `Learnings/`. |
| 11 | `/11-competitor-feature-analysis` | Logged-in competitor UI capture; comparison report + HTML deck. |
| 12 | `/12-ingest-knowledge` | Ingest external docs (Drive, Zoom, Fathom/Otter/Fireflies/Granola/Gong/Timeless, Gmail, local Inbox) into `Knowledge/02–06` as token-efficient cards. Propose-then-confirm. |
| 13 | `/13-validation-storyboard` | Capture a URL or product/demo video into a validation storyboard — screenshots + checklist to validate. Needs Node (see INSTALL). |

**Typical flow:** 01 discovery → 02–04 planning → 05 PRD → 06 tech plan → 07–09 review → 10 learn. Skills 11 (competitor analysis), 12 (knowledge ingest), and 13 (validation storyboard) are standalone, run anytime.

## Workflow

### Phase: welcome

**Progress:** Print progress header first (step 1 of 7 — Welcome is current). Write `Knowledge/onboarding-progress.md`.

Explain in plain language:

- They have **13 PM workflow skills** (show the table above, compactly)
- Their key files: `CLAUDE.md`, `Knowledge/`, `Outputs/`, `Learnings/`

Ask: *"Ready to set up your workspace? This takes about 5–10 minutes."*

Update state: `completed` includes `welcome`, `phase` → `workspace`. Refresh `Knowledge/onboarding-progress.md`.

### Phase: workspace

**Progress:** Print progress header first (step 2 of 7 — Workspace is current). Write `Knowledge/onboarding-progress.md`.

**Say to the user before you touch anything:**

> "Next I'll set up your **workspace** — the folder where BuilderOS keeps your PM work."

Then explain what you're about to create (use this table — adapt if some already exist):

| Folder / file | What it's for |
|---------------|---------------|
| `CLAUDE.md` | Your product context — role, company, metrics. Every skill reads this first. |
| `Knowledge/` | Reference docs — product, market, ICP, projects, and tool config |
| `Knowledge/01-Templates/` … `06-Projects/` | Numbered subfolders for templates, product docs, market context, ICP, workspace tools, and active projects |
| `Knowledge/workspace-tools.md` | Which tools you use (Monday, Mixpanel, …) and their MCP server names |
| `Outputs/` | Where skills save PRDs, tech plans, and reports |
| `Learnings/` | Retros and process notes from `/10-learn` |

Add one line of reassurance: *"If you've run bootstrap before, I'll only fill in what's missing — I won't overwrite anything you've already edited."*

**Then do the work** (report each action in plain language as you go):

1. Verify `Knowledge/`, `Outputs/`, `Learnings/` exist. Create any that are missing (`mkdir -p`).
   - Under `Knowledge/`, also create numbered subfolders if missing: `01-Templates`, `02-Product-Knowledge`, `03-Market-Knowledge`, `04-ICP`, `05-Workspace-Tools`, `06-Projects`.
   - Also create `Knowledge/_inbox/` (drop zone for files to ingest) and `Knowledge/_ingested/` (manifest log) — both used by `/12-ingest-knowledge`.
   - *Say:* "Created `Outputs/` — this is where your PRDs will land." (or "Already had `Outputs/` — leaving it alone.")
2. If `CLAUDE.md` or `Knowledge/workspace-tools.md` is missing, bootstrap:
   - Prefer running the plugin bootstrap script if you can resolve its path:
     `bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/*/bin/bootstrap.sh`
   - Or copy from plugin templates without overwriting existing files:
     - `templates/CLAUDE.md.template` → `CLAUDE.md`
     - `templates/Knowledge/workspace-tools.md.template` → `Knowledge/workspace-tools.md`
   - *Say:* "Copied starter `CLAUDE.md` — we'll fill in your details in the next step." (not "ran bootstrap.sh")
3. **Never overwrite** existing `CLAUDE.md` or `Knowledge/workspace-tools.md`.
4. Optionally run `bin/validate-workspace.sh` from the plugin (if available) and report gaps in plain language (not raw script output).

**Wrap up** with a short checklist the user can scan:

```
✓ Workspace folder: <path>
✓ Folders: Knowledge/ (with 01–06 subfolders), Outputs/, Learnings/
✓ CLAUDE.md — <created | already existed>
✓ workspace-tools.md — <created | already existed>
```

Ask: *"Look good? Next we'll fill in your product context."*

Update state: `completed` includes `workspace`, `phase` → `claude_md`. Refresh `Knowledge/onboarding-progress.md`.

### Phase: claude_md

**Progress:** Print progress header first (step 3 of 7 — Your product context is current). Write `Knowledge/onboarding-progress.md`.

Interview for `CLAUDE.md`. Map answers to these fields from the template:

| Field | Template placeholder |
|-------|---------------------|
| Role | `[Product Manager / Product Lead / etc.]` |
| Company | `[Your company]` |
| Product | `[One-line product description]` |
| Target users | `[Who the product serves]` |
| Current focus | `[Current quarter/half theme]` |
| Primary metric | `[Your North Star or current priority metric]` |
| OKRs | `[Paste OKRs or [NEED: define explicit OKRs]]` |

**If file already exists:** read it first. Only replace lines that still contain `[BRACKETED]` placeholders or obvious template defaults. Preserve terminology, guardrails, writing rules, sub-agent roles, verification sequence, and workspace conventions sections unchanged.

**Questions (batch across 2–3 turns):**

1. What's your role and company?
2. In one line, what does your product do, and who is it for?
3. What's your current focus this quarter/half?
4. What's your primary metric or North Star right now?
5. (Optional) Paste OKRs or say "skip" → use `[NEED: define explicit OKRs]`

Show a preview of the PM Context header block, then write/update `CLAUDE.md`.

Update state: `completed` includes `claude_md`, `phase` → `tools`. Refresh `Knowledge/onboarding-progress.md`.

### Phase: tools

**Progress:** Print progress header first (step 4 of 7 — Your tools is current). Write `Knowledge/onboarding-progress.md`.

Interview for `Knowledge/workspace-tools.md`. For each category, ask if they use it. If yes, collect tool name, workspace URL, optional board/project ID, and MCP server name. If no, mark the section:

`_Not configured — paste content into chat when a skill asks, or fill this section later._`

Categories:

1. **Backlog** (Jira, Linear, Monday, GitHub Issues, Notion, …)
2. **Release Board**
3. **Customer Meeting Transcripts** (+ optional local CSV/folder paths)
4. **Support Tickets**
5. **Analytics** (Mixpanel, Amplitude, PostHog, …)
6. **Attachments** (optional)
7. **Knowledge Sources** (optional, for `/12-ingest-knowledge`) — ask one question per source the user mentions using; skip the rest with `_Not configured_`. Sources to offer:
   - Google Drive (MCP server name or local mount path + folder URLs)
   - Zoom (MCP server name + account email)
   - Notetakers: Fathom / Timeless / Otter / Fireflies / Granola / Gong (per service: MCP server name or local export folder)
   - Gmail labels (MCP server name — default `gmail-personal` — and label names)
   - Local Inbox: always `Knowledge/_inbox/` (no prompt needed)

Remind: MCP servers are configured in Claude Code (`/mcp` or `~/.claude.json`); this file only records the **server names** skills should call.

Show preview, then write/update `Knowledge/workspace-tools.md` (merge with existing content; don't wipe custom notes).

Update state: `completed` includes `tools`, `phase` → `mcp`. Refresh `Knowledge/onboarding-progress.md`.

### Phase: mcp

**Progress:** Print progress header first (step 5 of 7 — MCP check is current). Write `Knowledge/onboarding-progress.md`.

1. Ask the user to run `/mcp` in Claude Code (or tell you which MCP servers they have configured).
2. Cross-check server names in `Knowledge/workspace-tools.md` against what's configured.
3. For any mismatch:
   - Fix names in `workspace-tools.md` if the user confirms the correct name, **or**
   - Point them to [Claude Code MCP docs](https://code.claude.com/docs/en/claude-code/mcp) to add missing servers
4. Do **not** edit `~/.claude.json` directly.

If they have no MCP servers yet, that's OK — explain skills 01–10 work with pasted content too; only auto-pull needs MCP.

Update state: `completed` includes `mcp`, `phase` → `tour`. Refresh `Knowledge/onboarding-progress.md`.

### Phase: tour

**Progress:** Print progress header first (step 6 of 7 — Skills tour is current). Write `Knowledge/onboarding-progress.md`.

1. Show the skill pipeline briefly: discovery (01) → planning (02–04) → PRD (05) → tech plan (06) → review (07–09) → learn (10). Skills 11–13 (competitor analysis, knowledge ingest, validation storyboard) are standalone.
2. Ask one question: **"What are you trying to accomplish this week?"**
3. Pick a recommended next skill using this decision tree:

| User goal (signals) | Recommend |
|-----------------------|-----------|
| Understand user problems, analyze calls/feedback | `/01-customer-discovery` |
| Pick what to build next, initiative direction | `/02-pm-planner` |
| Write a PRD (has a feature brief or prior planning) | `/05-create-prd` |
| Review something already shipped | `/09-pm-reviewer` |
| Compare competitors on a feature | `/11-competitor-feature-analysis` (+ INSTALL.md Step 6 for setup) |
| Build the Knowledge base from docs, calls, or transcripts | `/12-ingest-knowledge` |
| Validate / QA a shipped flow or a product/demo video | `/13-validation-storyboard` (+ INSTALL for setup) |
| Unsure / just testing | `/05-create-prd` smoke test — paste a short problem statement; no MCP required |

Store the recommendation for the finish phase.

Update state: `completed` includes `tour`, `phase` → `finish`. Refresh `Knowledge/onboarding-progress.md`.

### Phase: finish

**Progress:** Print progress header first (step 7 of 7 — all steps done, show **Setup complete**). Write final `Knowledge/onboarding-progress.md` with `Status: complete`.

1. Optionally run `bin/validate-workspace.sh` and mention any remaining gaps (non-blocking).
2. Write `Knowledge/onboarding-summary.md`:

```markdown
# BuilderOS onboarding complete — <YYYY-MM-DD>

## Your workspace
- Root: <workspace path>
- PM context: `CLAUDE.md` — filled: <list key fields>
- Tools: <compact list, e.g. backlog=Monday, analytics=Mixpanel, or "none configured (paste mode)">

## Your installed skills
<compact table or bullet list of /01 through /13>

## Recommended next step
Run `<slash-command>` because <one sentence tied to their stated goal>.

## Optional later
- Configure MCP servers you skipped: <list or "none">
- Skill 11 competitor analysis: see INSTALL.md Step 6
- Skill 13 validation storyboard: needs Node — see INSTALL.md
- Re-run `/00-onboarding` anytime to update context
```

3. Set `Knowledge/onboarding-state.json` → `"complete": true`, `phase` → `finish`. Set `Knowledge/onboarding-progress.md` → `Status: complete`.
4. Congratulate briefly. Tell them their summary is saved and give the single recommended slash command to run now.

## File-write rules

- Write files relative to the **workspace root** (where `CLAUDE.md` lives)
- Preserve all non-placeholder content in existing files
- Do not create `Outputs/` artifacts beyond what bootstrap needs
- `onboarding-summary.md`, `onboarding-progress.md`, and `onboarding-state.json` live under `Knowledge/`

## Anti-patterns

- Do not run plugin install commands
- Do not overwrite user-edited `CLAUDE.md` sections
- Do not invent MCP server names — ask or use `[NEED: ...]`
- Do not skip the goal question — the next-step recommendation depends on it
- Do not dump the entire INSTALL.md — link to it for deep dives (skill 11, MCP setup)
- Do not skip the progress header — users need orientation at every phase
