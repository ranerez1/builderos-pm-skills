# Changelog

All notable changes to this plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) loosely.

## Unreleased

### Added
- **Optional "Taskley" practice workspace.** A ready-made sample workspace built around a fictional task-management product, for trying the skills without wiring up your own product. Ships as plugin assets under `templates/sample-workspace/` (populated `Knowledge/` 01–06, a self-contained single-file web app at `06-Projects/Taskley-App/index.html`, and pre-captured `competitor-flows/` so `/11` runs with no competitor logins). New `bin/load-sample.sh` copies it into a throwaway workspace folder — **copy-if-missing**, so it never overwrites existing files. Documented as optional **INSTALL.md Step 3e**. Strictly opt-in: `bin/bootstrap.sh` and a normal install are unchanged.

## 1.7.0 — 2026-06-20

### Changed
- **`/13-validation-storyboard` storyboard.html got a full visual redesign** — "Inspection Console" aesthetic: dark editorial-technical look (warm off-white ink on near-black paper, amber accent, terminal-green for status), Newsreader serif display + IBM Plex Sans body + JetBrains Mono technical metadata via Bunny Fonts (Google Fonts mirror, no tracking) with graceful system fallback when offline. Asymmetric hero, left-rail step IDs, hairline-rule manifests, framed screenshots, film-grain SVG overlay. Page-load cascade animation (CSS-only, no JS). Replaces the previous generic dashboard-card look that hit `/frontend-design`'s warned-against "generic AI aesthetics" pattern.
- **Renamed the rendered label from "Assertions" → "Checklist to validate"** in both `storyboard.html` and `validation.md`. The underlying `flow.json` field name stays `assertions` — schema is stable across versions, so any downstream consumer or hand-edit workflow is unaffected.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code.
3. To refresh existing artifacts under the new look, re-run the renderers against any existing `flow.json`: `node scripts/render-html.mjs --flow=<path>` and `node scripts/render-md.mjs --flow=<path>`. No re-capture needed.
4. `flow.json` schema unchanged; no migration.

## 1.6.0 — 2026-06-19

### Added
- **`/13-validation-storyboard` URL mode now defaults to a fully headless auto-walk** (no user input). `scripts/capture-url-auto.mjs` discovers page section headings, scrolls to each, screenshots, and writes `flow.json` with templated `action` / `expected_behavior` / `assertions`. Lessons from real-world capture runs (a Halo dashboard test on `halo.preview.pixellot.tv`) are baked into the new lib:
  - `scripts/lib/page-discovery.mjs` — `findHeadings` deduplicates same-text headings by picking the **deepest by absolute Y** (skips the common pattern where pages duplicate headings in a hidden mobile-nav at `top: 0`). `scrollToHeading` and `collectContextAroundHeading` are reusable for future capture modes.
  - Viewport default lowered from `1440×900` → `1440×700` so tall pages have enough scroll runway for each section to land near the viewport top instead of clamping at max-scroll.
  - Section cap defaults to 8 (`--max-sections=N` to override).
- **`--interactive` flag** preserves the pre-1.6.0 manual walk (`scripts/capture-url-interactive.mjs` = renamed from `capture-url.mjs`). Use it for multi-screen flows, modals, or pages that hide content behind tabs/accordions.
- **`--headed` flag** for auto-walk lets you watch the browser during a debugging run.
- **Transcript-aware video capture** for both tiers. New `scripts/lib/transcript.mjs` fetches captions:
  - **Platform URLs** (Loom, YouTube, Vimeo, etc.) — yt-dlp `--write-auto-subs --sub-format vtt --sub-langs "en.*,en-orig" --skip-download` runs alongside the video download.
  - **Local files** — looks for a sidecar `<videofile>.vtt` or `.srt` in the same directory.
  - Best-effort: silent fallback when no captions are available.
- **Tier A (Gemini)** now appends a `TRANSCRIPT (timestamps in seconds): …` block to the prompt when captions are available. Speaker narration grounds step labels in what's said, not just what's visible — large quality lift on screen recordings.
- **Tier B (no Gemini key)** now shows the transcript snippet around each scene-change timestamp (±2s/+5s window) and pre-fills the interactive label/action prompts so the user accepts with Enter rather than starting blank.

### Changed
- Auto-walk emits `01-initial-load` followed by `02-` … `0N-` step-per-discovered-heading. Filename schema unchanged (still `<NN>-<topic-slug>.png`).
- ffmpeg helpers (`scripts/lib/ffmpeg.mjs`) now return `[{ path, timestamp }]` instead of bare paths so Tier B can align transcripts to scene-change frames. Internal API change only; renderers/flow.json untouched.
- `--auto-approve=appends-only` from skill 12 is unaffected; no cross-skill changes.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code.
3. If you were running `/13-validation-storyboard --url=<...>`: that command now defaults to auto-walk. To keep the old behavior (manual walk + label per step), add `--interactive`.
4. No deps changed; no migration needed for existing `flow.json` artifacts.

## 1.5.0 — 2026-06-19

### Added
- **New skill `/13-validation-storyboard`** — accepts either a live URL (`--url=<...>`) or a video (`--video=<path-or-platform-url>`) and produces a step-by-step validation artifact at `Outputs/validation-storyboards/<feature>-<date>/`:
  - **`storyboard.html`** — self-contained, CSS-only (no JS) interactive page with per-step cards, screenshots, expected behavior, and assertions. CSS-only `:target` lightbox for screenshot zoom.
  - **`validation.md`** — platform-agnostic prose playbook so any AI agent (Claude with a browser MCP, a Playwright bot, a human QA tester) can execute the validation independently against production.
  - **`flow.json`** — source-of-truth schema; both renderers read it, and hand-edits re-render cleanly.
- **URL mode** uses CloakBrowser with a persistent profile (cookies/localStorage survive across runs) — vendors the minimal launcher and profile-lock from skill 11. Interactive walk: navigate in the browser, describe each step in the terminal, screenshot captured per step. `flow.json` written incrementally — Ctrl-C leaves you with what you captured.
- **Video mode — Tier A (`GEMINI_API_KEY` set)** sends the video to Gemini 2.5 Flash with a step-segmentation prompt and extracts a frame per step via ffmpeg.
- **Video mode — Tier B (no Gemini key)** falls back to ffmpeg scene-detection (with uniform-sampling safety net) plus an interactive labeling loop. Same `flow.json` schema as Tier A — downstream renderers don't know which tier produced it. Skipped frames are deleted so `screenshots/` ends clean.
- HTML template-literal + CSS-variables pattern adapted from skill 11's `presentation.mjs`; Gemini upload + polling pattern modeled after `~/.claude/skills/video-ux-review/`. Vendored, not imported — every skill stays self-contained.
- `INSTALL.md` (skill-level) documents the Node + ffmpeg + yt-dlp + Python prerequisites; auto-installs `google-genai` into a `.venv` on first Tier A use.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code.
3. First time you use `/13-validation-storyboard` in a workspace: run `npm install` in the skill folder (or let the skill do it on first invocation). For video mode, install `ffmpeg` and `yt-dlp` system-wide; for Tier A specifically, set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).

## 1.4.0 — 2026-06-19

### Added
- **Salience pre-filter** in `/12-ingest-knowledge` (step 3.5). Before routing, the skill asks "is this content worth keeping or routine admin/internal noise?" and drops noise (calendar holds, internal standups, ack emails, status updates) silently. The single biggest anti-spam move; makes scheduled `--auto-approve` runs safe. Opt out with `--no-salience-filter` to diagnose false negatives.
- **`--auto-approve=appends-only` mode** for scheduled runs. Writes APPEND rows directly to known topic files but **queues CREATE rows** to `Knowledge/_inbox/pending-review.md` instead of spawning new files unattended. New scheduled-mode recommendation: `/schedule "daily at 7am" /12-ingest-knowledge --auto-approve=appends-only --since=yesterday`.
- **`Knowledge/_inbox/pending-review.md` queue.** A single append-only markdown file that holds CREATE proposals queued by `--auto-approve=appends-only`. The next interactive run surfaces these entries at the top of the proposal table — drain by typing `/12-ingest-knowledge` (no flags). No new commands, no new lifecycle.
- **`evals/` folder** with a five-minute runbook, six fixture docs covering the core invariants (salience filter, append vs create, cross-links, concept summary, no-paste rule, dedupe), seed Knowledge state, and an optional LLM-judge prompt template. Human-eyeball default; no CI, no harness, no golden diffs.

### Changed
- Report line now includes `skipped as noise` and `queued to pending-review` counts.
- `--auto-approve` (bare) is now an alias for `--auto-approve=all`; behaviour unchanged for existing callers.

### Upgrade path
1. `claude plugin update builderos-pm-skills@builderos-pm`
2. Restart Claude Code.
3. If you're running a scheduled ingestion: replace `--auto-approve` with `--auto-approve=appends-only` in your `/schedule` entry. Bare `--auto-approve` keeps working (back-compat) but `appends-only` is now the recommended scheduled-mode flag.

## 1.3.2 — 2026-06-19

### Changed
- `/12-ingest-knowledge` now writes **cross-links between sibling sections from the same doc.** When a single ingestion produces multiple routing rows (e.g. one customer call → an ICP section *and* a Product-Knowledge section), each section ends with a `Related: [other-topic](relative/path.md)` line pointing at its siblings. Preserves the "these came from the same conversation" connection that was previously lost across folders.
- Added a softer second-tier guideline: **inline-link other topic files** when their name comes up naturally in section prose and the file already exists. Not enforced — only suggested when it helps a reader follow the thread.

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
