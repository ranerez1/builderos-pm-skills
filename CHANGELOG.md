# Changelog

All notable changes to this plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) loosely.

## Unreleased

## 1.3.1 — 2026-06-19

### Changed
- `/12-ingest-knowledge` topic files now open with a **1–3 sentence concept summary** under the H1, before any dated sections. `CREATE` writes it on first contact; `APPEND` retroactively adds one if the file is missing it. Downstream skills (PRD, discovery, reviewers) read the top-of-file to orient in <100 tokens without scanning every section. Inspired by the [llms.txt](https://llmstxt.org/) convention and Matuschak's evergreen-notes "concept-oriented" principle.

## 1.3.0 — 2026-06-19

### Changed
- **`/12-ingest-knowledge` simplified.** The skill no longer fragments docs into many small claim-cards. New behaviour:
  - **One topic file per (folder × topic)** with topic-slug filenames (`ops-manager.md`, `billing-edge-cases.md`) — no more `YYYY-MM-DD_<slug>.md` per ingestion. The date moves into a `## YYYY-MM-DD — …` section heading inside the file.
  - **Append by default.** New evidence appends as a dated section to the best-fit existing file in the target folder. CREATE only when no file fits.
  - **One routing decision per doc**, not per claim. A doc may produce two rows if it clearly spans two folders, but the unit is still doc → file.
  - **No strict length caps.** Dropped the 40-line / 1500-token cap, the ≤20-word atomic-claim rule, the per-doc claim splitting, the schema enum, and the controlled-vocab README requirement.
  - **One hard content rule kept**: never paste raw transcripts — summarise and link the source.
  - **Lighter confirmation table** (`# / source / action / → file`).
  - `--auto-approve` is now binary (the `high-confidence` tier is gone since confidence scoring was dropped).
- Manifest, dedupe, `--dry-run`, `--source`, `--since` flags unchanged.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code.
3. Existing cards under `Knowledge/02–06` are untouched — only future ingestion runs use the new shape. If you want to consolidate old date-stamped cards into topic files, do it by hand; the skill won't migrate them.

## 1.2.0 — 2026-06-11

### Added
- **New skill `/12-ingest-knowledge`** — ingests external docs (Google Drive, Zoom recordings, Fathom / Timeless / Otter / Fireflies / Granola / Gong notetakers, Gmail attachments, local Inbox) and partitions them into `Knowledge/02–06` as token-efficient structured cards. Propose-then-confirm by default; supports `--auto-approve=high-confidence` for scheduled runs via `/schedule`. Hard 40-line / 1500-token cap per card; evidence stored as pointers, not raw quotes; controlled `entities` / `intents` vocab; append-before-create to prevent file sprawl.
- **Per-folder routing rubric** — `Knowledge/02-Product-Knowledge` / `03-Market-Knowledge` / `04-ICP` / `06-Projects` each ship a `README.md` (via `templates/Knowledge/<folder>/README.md.template`) that defines the card schema and what belongs there. `01-Templates` and `05-Workspace-Tools` are hand-curated; the skill never writes to them.
- **`Knowledge Sources` section in `workspace-tools.md`** — new template block for Drive, Zoom, notetakers, Gmail labels, and the local Inbox. `/00-onboarding` prompts for these during the tools phase.
- **Helper folders on bootstrap** — `Knowledge/_inbox/` (drop zone for ad-hoc local files) and `Knowledge/_ingested/` (manifest log for dedupe + audit trail) are created on every fresh workspace install.
- **Numbered `Knowledge/` subfolders on bootstrap** — `01-Templates`, `02-Product-Knowledge`, `03-Market-Knowledge`, `04-ICP`, `05-Workspace-Tools`, and `06-Projects` are created on every fresh workspace install via `bin/bootstrap.sh` and documented in `INSTALL.md`.

### Changed
- `bin/validate-workspace.sh` warns when numbered Knowledge subfolders are missing (re-run bootstrap to add them on existing workspaces).
- `/00-onboarding` now references 12 skills (was 11) and includes a Knowledge Sources Q&A step.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code to pick up `/12-ingest-knowledge`
3. On existing workspaces, re-run `bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/bootstrap.sh` from the workspace root to add the new READMEs and `_inbox/_ingested` helper folders. Idempotent — won't overwrite anything you've edited.

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
