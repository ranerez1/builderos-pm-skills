# BuilderOS PM Skills

A Claude Code plugin with 10 PM workflow skills covering the full loop from customer discovery → planning → PRD → review → learn → competitor analysis.

## Skills

| # | Slash command | What it does |
|---|---------------|--------------|
| 01 | `/01-customer-discovery` | Synthesize customer feedback (meetings, calls, notes, CSVs) into the top user-problem trends. Read-only. |
| 02 | `/02-pm-planner` | Turn an unstructured problem space into 2–3 initiative candidates, then a focused kickoff one-pager. |
| 03 | `/03-cto-planner` | Stress-test an initiative against the existing codebase; surface gaps, edge cases, open questions. |
| 04 | `/04-ux-planner` | Produce a UX plan: users, journeys, IA, key screens/states, UX acceptance criteria. |
| 05 | `/05-prd-to-tech-plan` | Write a concise, implementation-ready Technical Design Doc to `Outputs/Technical Docs/`. |
| 06 | `/06-ui-ux-review` | Review PRD + UI implementation; return prioritized feedback and concrete fixes. |
| 07 | `/07-rnd-reviewer` | Review PRD/TDD + implementation as a senior engineer. |
| 08 | `/08-pm-reviewer` | Review PRD + shipped experience as a PM (problem, scope, trade-offs, metrics, rollout). |
| 09 | `/09-learn` | Ship retro (update PRD/TDD) and/or process–skill improvement; writes to `Learnings/`. |
| 10 | `/10-competitor-feature-analysis` | Capture logged-in competitor product UI via CloakBrowser, compare a feature across competitors, generate a report + HTML deck. |

## Install

**Quick start.** Open a terminal app on your computer (macOS: Terminal.app; Windows: Windows Terminal or PowerShell) — **not** a Claude chat — and run:

```bash
claude plugin marketplace add ranerez1/builderos-pm-skills
claude plugin install builderos-pm-skills@builderos-pm
```

> ⚠️ These are shell commands. They run in your terminal, not in a Claude conversation. If you paste them into Claude chat, claude.ai, or the Claude Code chat panel, you'll just get a text reply explaining the command — nothing will install.
>
> Already inside Claude Code (CLI or IDE)? You can alternatively use `/plugin marketplace add …` and `/plugin install …` directly there. Plugins do not work in the Claude desktop chat app or claude.ai.

Then copy `templates/CLAUDE.md.template` and `templates/Knowledge/workspace-tools.md.template` into your workspace and edit them.

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
| 02–08 planning/review | Optional — works with pasted content too | MCP makes it pull context automatically |
| 09 learn | Tracker MCP optional | Reads PRD/TDD from `Outputs/`, writes to `Learnings/` |
| 10 competitor-analysis | None — uses CloakBrowser locally | Needs Node 18+, macOS/Windows |

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
│   ├── 01-customer-discovery/SKILL.md
│   ├── 02-pm-planner/SKILL.md
│   ├── 03-cto-planner/SKILL.md
│   ├── 04-ux-planner/SKILL.md
│   ├── 05-prd-to-tech-plan/SKILL.md
│   ├── 06-ui-ux-review/SKILL.md
│   ├── 07-rnd-reviewer/SKILL.md
│   ├── 08-pm-reviewer/SKILL.md
│   ├── 09-learn/SKILL.md
│   └── 10-competitor-feature-analysis/      # SKILL.md + scripts + INSTALL.md
└── templates/
    ├── CLAUDE.md.template
    ├── Knowledge/workspace-tools.md.template
    └── empty-dirs/{Outputs,Learnings,Knowledge}/.gitkeep
```

## License

MIT — see `LICENSE`.
