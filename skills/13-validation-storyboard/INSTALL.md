# Install — `13-validation-storyboard`

One-time setup the first time you use this skill in a workspace.

## Node dependencies

```bash
cd ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/skills/13-validation-storyboard
npm install
```

Or, from your workspace, the skill will run `npm install` itself on first invocation if `node_modules/` is missing.

## System dependencies

- **`ffmpeg`** — required for video-mode frame extraction (both tiers).
  - macOS: `brew install ffmpeg`
  - Linux: `apt install ffmpeg` (or your distro's equivalent)

- **`yt-dlp`** — required only when `--video` is a platform URL (YouTube, Loom, Vimeo, etc.).
  - macOS: `brew install yt-dlp`
  - Linux: `pip install yt-dlp` (or `apt install yt-dlp` on recent distros)

- **Python 3.10+** — required only for video-mode Tier A (Gemini-driven step segmentation).
  - Skill auto-installs the `google-genai` package into a `.venv/` on first use of Tier A.

## API keys

- **`GEMINI_API_KEY`** (or `GOOGLE_API_KEY`) — optional. When set, video-mode uses Tier A (Gemini-driven step segmentation). When unset, video-mode falls back to Tier B (ffmpeg scene-detection + interactive labeling). Get a key at <https://aistudio.google.com/apikey>.

## What the skill produces

```
<workspace>/Outputs/validation-storyboards/<feature-slug>-<YYYY-MM-DD>/
  storyboard.html       (open in a browser — interactive review)
  validation.md         (hand to any AI agent or human QA)
  flow.json             (source of truth — re-renderable)
  screenshots/*.png
```
