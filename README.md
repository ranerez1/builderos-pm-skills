# BuilderOS PM Skills

A Claude Code plugin with 14 PM workflow skills (+ interactive onboarding) covering the full loop from customer discovery → planning → PRD → tech plan → review → learn, plus competitor analysis, knowledge ingest, validation storyboards, and Mixpanel data analysis.

## Skills

| # | Slash command | What it does |
|---|---------------|--------------|
| 00 | `/00-onboarding` | Guided first-time setup: fill `CLAUDE.md` and `workspace-tools.md`, tour installed skills, get a personalized next step. |
| 01 | `/01-customer-discovery` | Synthesize customer feedback (meetings, calls, notes, CSVs) into the top user-problem trends. Read-only. |
| 02 | `/02-pm-planner` | Turn an unstructured problem space into 2–3 initiative candidates, then a focused kickoff one-pager. |
| 03 | `/03-cto-planner` | Stress-test an initiative against the existing codebase; surface gaps, edge cases, open questions. |
| 04 | `/04-ux-planner` | Produce a UX plan: users, journeys, IA, key screens/states, UX acceptance criteria. |
| 05 | `/05-create-prd` | Consolidate 01–04 outputs into a decision-ready feature PRD (GIFTS); saves to `Outputs/Product PRDs/`. |
| 06 | `/06-prd-to-tech-plan` | Write a concise, implementation-ready Technical Design Doc to `Outputs/Technical Docs/`. |
| 07 | `/07-ui-ux-review` | Review PRD + UI implementation; return prioritized feedback and concrete fixes. |
| 08 | `/08-rnd-reviewer` | Review PRD/TDD + implementation as a senior engineer. |
| 09 | `/09-pm-reviewer` | Review PRD + shipped experience as a PM (problem, scope, trade-offs, metrics, rollout). |
| 10 | `/10-learn` | Ship retro (update PRD/TDD) and/or process–skill improvement; writes to `Learnings/`. |
| 11 | `/11-competitor-feature-analysis` | Capture logged-in competitor product UI via CloakBrowser, compare a feature across competitors, generate a report + HTML deck. |
| 12 | `/12-ingest-knowledge` | Ingest external docs (Drive, Zoom, notetakers, Gmail, local Inbox) into `Knowledge/` as structured cards. Propose-then-confirm. |
| 13 | `/13-validation-storyboard` | Capture a URL or product/demo video into a validation storyboard — screenshots + a checklist to validate. |
| 14 | `/14-mixpanel-data-analysis` | Investigate why a metric moved in Mixpanel, then build a live dashboard + a saved analysis memo in `Outputs/Analytics/`. |
| 15 | `/15-prd-to-epic` | Turn a PRD + prototype into an Epic-level backlog with atomic User Stories; writes `epic-<slug>.md` to `Outputs/Product PRDs/`. |

> Upgrading from 0.x? Skills 05–10 were renumbered to 06–11 to make room for `/05-create-prd`. See [CHANGELOG.md](CHANGELOG.md).

## Install

**Quick start.** Open a terminal app on your computer (macOS: Terminal.app; Windows: Windows Terminal or PowerShell) — **not** a Claude chat — and run:

```bash
claude plugin marketplace add ranerez1/builderos-pm-skills
claude plugin install builderos-pm-skills@builderos-pm
```

> ⚠️ These are shell commands. They run in your terminal, not in a Claude conversation. If you paste them into Claude chat, claude.ai, or the Claude Code chat panel, you'll just get a text reply explaining the command — nothing will install.
>
> Already inside Claude Code (CLI or IDE)? You can alternatively use `/plugin marketplace add …` and `/plugin install …` directly there. Plugins do not work in the Claude desktop chat app or claude.ai.

Then bootstrap your workspace and run `/00-onboarding` in Claude Code (recommended) — or copy the templates and edit them manually.

**Full step-by-step walkthrough** (recommended for first install): [INSTALL.md](INSTALL.md).

**Want to try the skills first?** An optional "Taskley" practice workspace (sample product Knowledge + a single-file app + competitor flows) loads into a throwaway folder via `bin/load-sample.sh` — see [INSTALL.md, Step 3e](INSTALL.md#3e-optional-try-the-skills-on-a-practice-workspace).

## What you need to provide

The skills are vendor-agnostic. To make them work end-to-end, configure your own:

- **MCP servers**: tracker (Monday/Jira/Linear/Notion), analytics (Mixpanel/Amplitude/PostHog), email/calendar (Gmail/Outlook), docs (Notion/Google Drive). Configure these in your Claude Code MCP settings, then list their server names in `Knowledge/workspace-tools.md`.
- **Workspace folders**: `Outputs/`, `Learnings/`, and `Knowledge/` (with numbered subfolders `01-Templates` … `06-Projects`) at the workspace root. Skills write artifacts there.
- **PM context**: `CLAUDE.md` at workspace root — terminology, writing rules, sub-agent roles. The template ships everything except your company-specific fields.

## Per-skill prereqs

| Skill | Needs an MCP server? | Notes |
|-------|----------------------|-------|
| 01 customer-discovery | Tracker / docs MCP **OR** local CSV/folder paths | Set under "Customer Meeting Transcripts" in workspace-tools |
| 02–04 planning | Optional — works with pasted content too | MCP makes it pull context automatically |
| 05 create-prd | Tracker MCP optional (to post a comment on a linked issue) | Reads upstream 01–04 outputs; writes `Outputs/Product PRDs/` |
| 06–09 review | Optional — works with pasted content too | MCP makes it pull context automatically |
| 10 learn | Tracker MCP optional | Reads PRD/TDD from `Outputs/`, writes to `Learnings/` |
| 11 competitor-analysis | None — uses CloakBrowser locally | Needs Node 18+, macOS/Windows |
| 12 ingest-knowledge | Source MCPs (Drive/Zoom/notetakers/Gmail) **OR** local `Knowledge/_inbox/` | Set under "Knowledge Sources" in workspace-tools |
| 13 validation-storyboard | None — drives a local browser | Needs Node 18+ |
| 14 mixpanel-data-analysis | Mixpanel MCP (query + dashboard tools) | Reads NSM from `CLAUDE.md`; writes `Outputs/Analytics/` |

## Updating

```
/plugin update builderos-pm-skills@builderos-pm
```

## Layout

```
.
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── README.md
├── LICENSE
├── skills/
│   ├── 00-onboarding/SKILL.md
│   ├── 01-customer-discovery/SKILL.md
│   ├── 02-pm-planner/SKILL.md
│   ├── 03-cto-planner/SKILL.md
│   ├── 04-ux-planner/SKILL.md
│   ├── 05-create-prd/SKILL.md
│   ├── 06-prd-to-tech-plan/SKILL.md
│   ├── 07-ui-ux-review/SKILL.md
│   ├── 08-rnd-reviewer/SKILL.md
│   ├── 09-pm-reviewer/SKILL.md
│   ├── 10-learn/SKILL.md
│   ├── 11-competitor-feature-analysis/      # SKILL.md + scripts + INSTALL.md
│   ├── 12-ingest-knowledge/SKILL.md
│   ├── 13-validation-storyboard/            # SKILL.md + scripts
│   └── 14-mixpanel-data-analysis/SKILL.md
└── templates/
    ├── CLAUDE.md.template
    ├── Knowledge/workspace-tools.md.template
    ├── sample-workspace/            # optional "Taskley" practice workspace (load-sample.sh)
    └── empty-dirs/
        ├── Outputs/.gitkeep
        ├── Learnings/.gitkeep
        └── Knowledge/
            ├── 01-Templates/.gitkeep
            ├── 02-Product-Knowledge/.gitkeep
            ├── 03-Market-Knowledge/.gitkeep
            ├── 04-ICP/.gitkeep
            ├── 05-Workspace-Tools/.gitkeep
            └── 06-Projects/.gitkeep
```

## License

MIT — see `LICENSE`.
