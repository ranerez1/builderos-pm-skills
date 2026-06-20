---
name: 13-validation-storyboard
description: Captures a product flow from either a live URL (headless auto-walk by default, interactive opt-in) or a video (Gemini-based step segmentation, or ffmpeg-based fallback when no Gemini key is set, with transcript awareness for both tiers). Produces a self-contained interactive HTML storyboard plus a platform-agnostic validation.md playbook that any AI agent or human QA can execute against production. Use when the user asks to build a validation/QA storyboard, turn a video into a test plan, generate a regression checklist from a screen recording, or runs /13-validation-storyboard.
disable-model-invocation: true
---

# 13 Validation Storyboard → URL or video → step-by-step test artifacts

Capture a product flow **once**, then turn it into a reusable validation artifact. Produces three files in `Outputs/validation-storyboards/<feature>-<date>/`:

- `storyboard.html` — interactive single-page review (CSS-only, no JS, portable)
- `validation.md` — platform-agnostic prose playbook for any AI agent or human QA
- `flow.json` — source-of-truth schema, re-renderable

The skill **does not run validations** — it produces artifacts. Consumers (Claude with a browser MCP, a Playwright agent, a human tester) execute them.

This skill is **invoked manually** by the user (`disable-model-invocation: true`); it runs Node + Python scripts that take ~30s–5min depending on mode.

## When to use

- A new feature is about to ship — capture its golden path once, hand `validation.md` to a regression-test agent every release.
- You have a Loom of a customer flow you want validated against your own product — extract the steps automatically.
- You want a beautiful HTML storyboard for stakeholders that doubles as an executable test plan.

## Inputs

Exactly one of:

- `--url=<https://...>` — live URL mode. Skill drives CloakBrowser through the flow; you navigate, it captures.
- `--video=<path-or-platform-url>` — video mode. Local `.mp4`/`.mov`/etc. file or a platform URL (YouTube, Loom, Vimeo, etc. — anything `yt-dlp` supports).

Plus required:

- `--feature=<slug>` — names the output folder (e.g. `billing-export`, `signup-onboarding`).

Plus optional:

- `--goal="<one-line>"` — what success means. If omitted, a templated goal is used (`The <feature> page renders all core sections...`).
- `--env=<staging|production|preview>` — annotates the storyboard (default `staging`).
- `--interactive` — URL mode only; switch from headless auto-walk to a real-browser walk where you navigate by hand and type labels per step (the pre-1.6.0 behavior).
- `--headed` — URL mode only; show the browser window during auto-walk (useful for debugging selectors).
- `--max-sections=N` — auto-walk only; cap the number of discovered sections (default 8).
- `--preconditions="line1|line2"` — pipe-separated preconditions to skip the prompt in auto-walk.

## Workflow

### 0) One-time setup

If `node_modules/` is missing, `npm install` is required in the skill folder. See `INSTALL.md` for `ffmpeg`, `yt-dlp`, and Python requirements. Tier A video mode also needs `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) set; without it, video mode falls back to Tier B.

### 1) Interview (only what's missing)

If `--goal` wasn't passed, the skill asks for it. Preconditions (e.g. "logged in as ops-manager", "feature flag X on") are always asked interactively — they're tester-context and can't be inferred from the URL or video.

### 2) Capture

**URL mode — Auto-walk (default)** (`scripts/capture-url-auto.mjs`):
- Launches CloakBrowser **headless** at viewport `1440×700` against `--url` with a persistent profile under `~/.cache/builderos-validation-storyboard/<feature>/` (so re-runs stay logged in).
- Always captures step `01-initial-load` (full page at scroll 0).
- Discovers section headings via the heuristic in `scripts/lib/page-discovery.mjs`:
  - Queries `h1, h2, h3, h4, [role="heading"]`.
  - Groups by trimmed lowercase text. Within each group, picks the heading with the **largest absolute Y** (skips the common pattern where pages duplicate headings in a hidden mobile-nav at `top: 0`).
  - Drops text < 2 chars or > 60 chars (skip icon-only nav labels and over-long page titles).
  - Sorts by reading order down the page; caps at 8 (override with `--max-sections=N`).
- For each section: scrolls heading to viewport-top + 24px, waits 700ms for layout settle, screenshots.
- Auto-fills `action`, `expected_behavior`, and `assertions` heuristically (templated action; assertion count derived from visible cards/tiles/links within ~800px below each heading).
- The user types **nothing**. Pass `--headed` to watch the browser, `--interactive` to switch to the manual walk.

**URL mode — Interactive** (`scripts/capture-url-interactive.mjs`, opt-in via `--interactive`):
- Launches CloakBrowser **headed** so you can navigate by hand.
- At each meaningful screen: switch back to the terminal, type a short label + action + expected behavior + assertions, screenshot is captured.
- `flow.json` is written incrementally — Ctrl-C leaves you with whatever you captured.
- Type `done` as the label to finish.

**Video mode — Tier A** (`scripts/capture-video.py`, runs when `GEMINI_API_KEY` is set):
- Downloads the video (yt-dlp for URLs, direct file path otherwise) and **best-effort fetches captions** (yt-dlp `--write-auto-subs` for platform URLs; looks for sidecar `.vtt`/`.srt` next to local files).
- Uploads to Gemini 2.5 Flash with a step-segmentation prompt; **appends transcript** as a `TRANSCRIPT (timestamps in seconds): …` block when captions are available. Speaker narration grounds the step labels in what's said, not just what's visible.
- Returns 4–12 sequential validation steps with timestamps + action + expected + assertions.
- `ffmpeg` extracts a frame per step at its timestamp.

**Video mode — Tier B** (`scripts/capture-video-frames.mjs`, fallback when no Gemini key):
- Prints a notice: `No Gemini key found — falling back to frame extraction + interactive labeling. Set GEMINI_API_KEY to enable automatic step segmentation.`
- Also best-effort fetches captions (same logic as Tier A).
- `ffmpeg` scene-detect extracts 4–20 candidate frames with timestamps. If outside that range, falls back to 8 uniformly-spaced frames.
- For each candidate: shows the file path **plus the transcript snippet covering `[t-2s, t+5s]`** when captions are available, and pre-fills the label / action prompts from that snippet (you accept with Enter or edit).
- Skipped frames are deleted. Same `flow.json` schema as Tier A — downstream renderers don't know which tier produced it.

### How auto-walk decides what to capture

Auto-walk is a **section-by-heading walker**, not a full-flow recorder. It captures the initial load plus every distinct section the page announces via a heading. This is the right model for **homepage and dashboard validation** where the page reveals its structure through headings.

It is **not** the right model for:
- Multi-screen flows (form wizards, signup funnels, modal sequences). Use `--interactive`.
- Pages that hide content behind tabs, accordions, or hover states. Use `--interactive`.
- Single-screen interstitials with no headings. Auto-walk captures only `01-initial-load` and tells you to re-run with `--interactive`.

After auto-walk, edit `flow.json` to tighten assertions, then re-run only the renderers (`node scripts/render-html.mjs --flow=<path>` and similar) — no recapture needed.

### 3) Render

`scripts/render-html.mjs` builds `storyboard.html` — self-contained, CSS-only `:target` lightbox for screenshot zoom, vertical step cards with a 2-col layout per card (screenshot left, body right; collapses on mobile). `scripts/render-md.mjs` builds `validation.md` — header, preconditions, "how to run this validation" intro, then numbered steps with action / expected / assertions / screenshot per step.

Both renderers read `flow.json`. You can edit `flow.json` by hand and re-render anytime:

```
node scripts/render-html.mjs --flow=Outputs/validation-storyboards/<dir>/flow.json
node scripts/render-md.mjs   --flow=Outputs/validation-storyboards/<dir>/flow.json
```

### 4) Report

Prints the three output paths and a one-line "open `storyboard.html` to review, or hand `validation.md` to an agent."

## Output location

```
<workspace>/Outputs/validation-storyboards/<feature-slug>-<YYYY-MM-DD>/
  storyboard.html
  validation.md
  flow.json
  screenshots/
    01-<step-slug>.png
    02-<step-slug>.png
    ...
```

The folder is portable — zip and ship; screenshots are referenced relatively. Any agent that can read markdown + open a browser can run the validation.

## flow.json schema

See `templates/flow.example.json`. Minimal shape:

```json
{
  "feature": "billing-export",
  "url": "https://app.example.com",
  "captured_at": "2026-06-19T14:22:00Z",
  "captured_via": "url|video",
  "preconditions": ["Logged in as ops-manager", "..."],
  "goal": "Ops manager can export a fiscal-month-aligned CSV in under 60s",
  "env": "staging",
  "steps": [
    {
      "id": "01-open-exports",
      "label": "Open Exports page",
      "action": "Click 'Exports' in the left nav",
      "expected_behavior": "Exports page loads with 'New export' button top-right",
      "screenshot": "screenshots/01-open-exports.png",
      "assertions": [
        "Page title contains 'Exports'",
        "Button labeled 'New export' is visible and enabled"
      ],
      "notes": ""
    }
  ]
}
```

## Flags reference

| Flag | Required? | Notes |
|------|-----------|-------|
| `--url=<...>` | one-of | Live URL mode |
| `--video=<...>` | one-of | Video mode (file path or platform URL) |
| `--feature=<slug>` | yes | Output folder name |
| `--goal="<...>"` | no | If omitted, asked interactively |
| `--env=<...>` | no | Defaults to `staging` |
| `--headless` | no | URL mode only |

## Hard rules

- **Never paste raw video transcripts** into `flow.json` or `validation.md` — store summaries and link to the source URL.
- **Screenshots must be referenced relatively** so the output folder is portable.
- **`flow.json` is the source of truth.** Don't hand-edit `storyboard.html` or `validation.md` — re-render instead.
- **No JavaScript in `storyboard.html`** — CSS-only render so it works in any browser without execution permissions.
- **`disable-model-invocation: true`** — this skill executes shell scripts and is invoked manually by the user, never auto-loaded by the model.

## Continuous / scheduled mode

Not supported in v1. Validation artifacts are created once per feature; they're meant to be **executed** on a schedule, not regenerated. Hand `validation.md` to a regression-test agent and schedule that.

## Reuse references (for maintainers)

- `scripts/lib/browser.mjs` — vendored from `skills/11-competitor-feature-analysis/scripts/lib/cloak.mjs`
- `scripts/lib/profile-lock.mjs` — vendored from skill 11
- HTML template-literal + CSS-variables pattern — adapted from `skills/11-competitor-feature-analysis/scripts/presentation.mjs`
- Gemini video upload + polling pattern — modeled after `~/.claude/skills/video-ux-review/SKILL.md`

We **vendor** rather than import across skills (matches the existing plugin pattern — every skill is self-contained).
