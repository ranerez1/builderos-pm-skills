# BuilderOS PM Skills

A Claude Code plugin with 11 PM workflow skills (+ interactive onboarding) covering the full loop from customer discovery → planning → PRD → tech plan → review → learn → competitor analysis.

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

## What you need to provide

The skills are vendor-agnostic. To make them work end-to-end, configure your own:

- **MCP servers**: tracker (Monday/Jira/Linear/Notion), analytics (Mixpanel/Amplitude/PostHog), email/calendar (Gmail/Outlook), docs (Notion/Google Drive). Configure these in your Claude Code MCP settings, then list their server names in `Knowledge/workspace-tools.md`.
- **Workspace folders**: `Outputs/`, `Learnings/`, `Knowledge/` at the workspace root. Skills write artifacts there.
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

## Updating

```
/plugin update builderos-pm-skills
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
│   └── 11-competitor-feature-analysis/      # SKILL.md + scripts + INSTALL.md
└── templates/
    ├── CLAUDE.md.template
    ├── Knowledge/workspace-tools.md.template
    └── empty-dirs/{Outputs,Learnings,Knowledge}/.gitkeep
```

## License

MIT — see `LICENSE`.
