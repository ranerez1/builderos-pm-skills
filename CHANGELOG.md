# Changelog

All notable changes to this plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) loosely.

## 1.1.0 — 2026-06-08

### Added
- **New skill `/00-onboarding`** — interactive post-install guide that bootstraps the workspace, fills `CLAUDE.md` and `Knowledge/workspace-tools.md` conversationally, explains installed skills, and writes `Knowledge/onboarding-summary.md` with a personalized next step. Supports resume via `Knowledge/onboarding-state.json`.
- **`bin/validate-workspace.sh`** — checks workspace folders and flags unfilled placeholders in config files.

### Changed
- `bin/bootstrap.sh` and templates now point new users to `/00-onboarding` instead of manual file editing.
- `INSTALL.md` Step 3 adds guided onboarding as the recommended path after bootstrap.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code to pick up `/00-onboarding`
3. Open your workspace and run `/00-onboarding` to fill or refresh context (safe on existing workspaces — merges, does not overwrite custom content)

---

## 1.0.0 — 2026-06-08

### Added
- **New skill `/05-create-prd`** — consolidates outputs from skills 01–04 (customer-discovery, pm-planner, cto-planner, ux-planner) into one decision-ready feature PRD using the GIFTS structure. Saves markdown under `Outputs/Product PRDs/`. Optionally posts a summary comment to a linked tracker issue via the MCP server named in `Knowledge/workspace-tools.md`.
- **`CHANGELOG.md`** at repo root (this file).

### Changed (breaking — slash-command renames)
Skills 05–10 were renumbered to 06–11 so `/05-create-prd` could slot in at the correct workflow position (after planning, before tech-plan). If you previously typed `/05-prd-to-tech-plan` or referenced any of these by number, update to the new IDs:

| Old slash command | New slash command |
|---|---|
| `/05-prd-to-tech-plan` | `/06-prd-to-tech-plan` |
| `/06-ui-ux-review` | `/07-ui-ux-review` |
| `/07-rnd-reviewer` | `/08-rnd-reviewer` |
| `/08-pm-reviewer` | `/09-pm-reviewer` |
| `/09-learn` | `/10-learn` |
| `/10-competitor-feature-analysis` | `/11-competitor-feature-analysis` |

Skills 01–04 are unchanged.

### Changed (helper scripts)
- `bin/setup-skill-10.sh` was renamed to `bin/setup-skill-11.sh` (the competitor-analysis skill it sets up moved from skill 10 to skill 11).
- A small deprecation stub remains at `bin/setup-skill-10.sh` for one release: it prints a notice and exec's the new path, so old documentation/notes that reference the old script still work.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm` (the marketplace + install commands are unchanged).
2. Replace any saved slash-command references using the table above.
3. Workspace files (`CLAUDE.md`, `Knowledge/`, `Outputs/`, `Learnings/`) and the templates are unchanged.

---

## 0.3.0 — 2026-06-08

### Changed
- Step 6 of `INSTALL.md` (skill 10 setup) replaced its raw shell block with a one-command helper: `bin/setup-skill-10.sh`. The helper validates Node version, runs `npm install`, downloads the CloakBrowser binary, and prints next steps. Safe to re-run.

## 0.2.0 — 2026-06-08

### Added
- `bin/bootstrap.sh` — one-command workspace bootstrap (creates `Knowledge/`, `Outputs/`, `Learnings/` and copies the two starter files). Idempotent.

### Changed
- `INSTALL.md` Step 3 rewritten in PM-friendly prose; the scary shell variable / `cp -n` block moved to a collapsible manual fallback.

## 0.1.0 — 2026-06-08

Initial release. 10 PM workflow skills (01-customer-discovery through 10-competitor-feature-analysis) packaged as a Claude Code plugin, installable via `claude plugin marketplace add ranerez1/builderos-pm-skills`.
