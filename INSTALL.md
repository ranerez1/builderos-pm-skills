# Install — BuilderOS PM Skills

A step-by-step walkthrough to install this plugin and run your first skill. Estimated time: 5 minutes (or 15 minutes if you also set up skill 11's competitor capture).

## What you'll do

1. Open a terminal on your computer.
2. Run two `claude plugin …` commands to install the plugin.
3. Run one bootstrap script to set up a workspace folder.
4. Run `/00-onboarding` in Claude Code to fill your context and pick a first skill.
5. Try your recommended skill (or `/05-create-prd` to smoke-test).

## Prerequisites

- **Claude Code** installed and authenticated ([install guide](https://docs.claude.com/en/docs/claude-code)). Quick check: open a terminal and run `claude --version` — if you see a version number, you're set.
- A workspace folder where you want to use the skills (your product repo, a PM scratch dir, anything).

Optional, per skill:
- MCP servers for your tracker / analytics / docs tools (Monday, Mixpanel, Notion, Gmail, etc.) — only needed for skills that pull live data.
- Node.js 18+ on macOS or Windows — only for skill 11 (competitor analysis).

---

## Step 0 — Open a terminal (not a Claude chat)

> If you're comfortable in a shell, skip to Step 1.

The install commands in this guide are **shell commands** — they run in a terminal app on your computer, not inside any Claude UI.

**Do NOT:**
- ❌ Paste these commands into the Claude chat app, claude.ai, or the chat panel inside Claude Code. Claude will treat them as a message and reply with text instead of running them.

**DO:**
- ✅ Open a real terminal app and paste the commands at the shell prompt.

**How to open a terminal:**

| OS | App to open | How to find it |
|---|---|---|
| **macOS** | Terminal (built-in) or iTerm2 | Press `⌘ + Space`, type `Terminal`, hit Enter |
| **Windows** | Windows Terminal, PowerShell, or Command Prompt | Press `Win` key, type `Terminal`, hit Enter |
| **Linux** | gnome-terminal, Konsole, xterm, etc. | Press `Ctrl + Alt + T` on most distros |

You'll know you're in the right place when you see a **shell prompt** — something like:

```
your-username@your-mac ~ %
```

or

```
PS C:\Users\you>
```

That's where commands like `claude plugin marketplace add …` go.

**Self-check before continuing:** at the shell prompt, run:

```bash
claude --version
```

If it prints a version number, you're good. If it says "command not found", see [Troubleshooting](#troubleshooting) — usually it's a quick PATH fix, or you need to [install Claude Code](https://docs.claude.com/en/docs/claude-code) first.

---

## Step 1 — Add the marketplace

A "marketplace" is just a registry that tells Claude Code where to find one or more plugins. This repo is a single-plugin marketplace.

**At the terminal prompt you opened in Step 0**, type (or paste) this and press Enter:

```bash
claude plugin marketplace add ranerez1/builderos-pm-skills
```

> ⚠️ **This is a shell command, not a chat message.** It runs in your terminal app — not in Claude chat, not in claude.ai, not in the Claude Code chat panel. If you paste it into a Claude conversation, Claude will reply with words instead of running it.
>
> If you're already in a Claude Code session (CLI or IDE), you can alternatively type `/plugin marketplace add ranerez1/builderos-pm-skills` directly into Claude Code. If you see `"/plugin isn't available in this environment"`, you're in the chat app — go back to your terminal.

**Expected output:**

```
✔ Successfully added marketplace: builderos-pm
```

Verify it's registered:

```bash
claude plugin marketplace list
```

You should see `builderos-pm` listed alongside any other marketplaces you have.

---

## Step 2 — Install the plugin

**In the same terminal**, run:

```bash
claude plugin install builderos-pm-skills@builderos-pm
```

(Alternatively, from inside a Claude Code session: `/plugin install builderos-pm-skills@builderos-pm`.)

**Expected output:**

```
✔ Successfully installed plugin: builderos-pm-skills@builderos-pm (scope: user)
```

Confirm it loaded:

```bash
claude plugin list
```

You should see `builderos-pm-skills@builderos-pm` with status `✔ enabled`.

**What just happened:** Claude Code cloned this repo into `~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/`. Skills under `skills/*/SKILL.md` are now discoverable as slash commands (`/00-onboarding` for setup, `/01-customer-discovery` through `/14-mixpanel-data-analysis` for PM work) and auto-triggered by the model when relevant.

---

## Step 3 — Set up a workspace folder

> **What's a "workspace"?** Just a regular folder on your computer where you'll keep your PM work — PRDs the skills generate, retros, your tool config, etc. The skills read and write files relative to this folder. You only do this setup once per workspace.

### 3a. Pick or create a workspace folder

If you already have one (e.g. a product repo you work in), use that. Otherwise create a fresh one anywhere you like. For example, on macOS:

```bash
mkdir -p ~/Documents/my-pm-workspace
cd ~/Documents/my-pm-workspace
```

The `cd` puts your terminal "inside" that folder so the next commands act on it. You can confirm where you are with `pwd`.

### 3b. Run the bootstrap helper

The plugin ships a one-command setup script that creates the right folders and copies two starter files in. Run this **in the same terminal**, from inside your workspace folder:

```bash
bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/bin/bootstrap.sh
```

You'll see output like:

```
✓ Created folders: Knowledge/ Outputs/ Learnings/ Knowledge/01-Templates/ …
✓ Copied CLAUDE.md (PM context — edit this next)
✓ Copied Knowledge/workspace-tools.md (tool config — edit this next)

Next:
  1. Open Claude Code in this folder and run /00-onboarding
  2. Or edit CLAUDE.md and Knowledge/workspace-tools.md manually.
```

> If it says "No such file or directory", your plugin cache is at a different path. Run `claude plugin list` to see the installed version, then replace `1.0.0` in the command above with whatever version it shows. Or paste the manual block below.

<details>
<summary><strong>Manual alternative (if the bootstrap script doesn't work)</strong></summary>

From your workspace folder, run these four lines:

```bash
mkdir -p Knowledge/{01-Templates,02-Product-Knowledge,03-Market-Knowledge,04-ICP,05-Workspace-Tools,06-Projects} Outputs Learnings
cp ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/templates/CLAUDE.md.template ./CLAUDE.md
cp ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/templates/Knowledge/workspace-tools.md.template Knowledge/workspace-tools.md
ls -la Knowledge
```

The last `ls -la` lists the folder so you can confirm `CLAUDE.md`, `Knowledge/`, `Outputs/`, and `Learnings/` are there. Then run `/00-onboarding` (Step 4a) or edit the files manually (Step 4b).

</details>

### 3c. (Optional) Try the skills on a practice workspace

If you'd rather kick the tires before wiring up your own product, the plugin ships a
ready-made sample workspace built around a fictional task-management product, **Taskley**.
This is completely optional — it has nothing to do with a normal install.

Load it into a **separate, throwaway folder** so it never mixes with your real work:

```bash
mkdir -p ~/Documents/pm-practice && cd ~/Documents/pm-practice
bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/bin/load-sample.sh
```

> Same path caveat as Step 3b — if it says "No such file or directory", run `claude plugin list` and replace `1.0.0` with the installed version.

You get populated `Knowledge/` (Taskley company, product strategy, ICP, competitive
analysis, a PRD template), a self-contained single-file web app at
`Knowledge/06-Projects/Taskley-App/index.html`, and pre-captured `competitor-flows/` so
`/11` works without any logins. The loader only adds files that don't already exist, so
it never overwrites your content.

---

## Step 4 — Fill your context

This is where you tell the skills who you are and what tools you use. You fill two starter
files the bootstrap created — `CLAUDE.md` (your role, company, product, metrics) and
`Knowledge/workspace-tools.md` (your tracker / analytics / docs tools) — either through the
guided onboarding flow (recommended) or by editing them yourself.

### 4a. Run the onboarding guide (recommended)

Open **Claude Code** (desktop app, CLI, or IDE extension) with your workspace folder as the project root, then run:

```
/00-onboarding
```

The guide will walk you through:

- What the plugin installed and where files live
- Filling `CLAUDE.md` with your role, company, product, and metrics
- Configuring `Knowledge/workspace-tools.md` for your tracker, analytics, and other tools
- A tour of skills 01–14 and a **personalized recommendation** for what to run first

When you finish, it saves a summary at `Knowledge/onboarding-summary.md`. You can re-run `/00-onboarding` anytime to update context — it merges with existing files instead of overwriting your edits.

### 4b. Manual alternative (edit files yourself)

If you prefer not to use the guided flow, open the starter files in any text editor (TextEdit, VS Code, Cursor, vim):

- **`CLAUDE.md`** — fill in the `[BRACKETED]` placeholders: your role, company, product, primary metric. Delete anything that doesn't apply. This is the context every skill reads first.
- **`Knowledge/workspace-tools.md`** — fill in your tracker / analytics / docs tool names and the MCP server names that connect to them. Skip the sections you don't have — the skills that need a missing tool will tell you what's missing.

The `Outputs/`, `Learnings/`, and `Knowledge/` folders the bootstrap created are where skills will save PRDs, retros, and reference docs as you use them. Under `Knowledge/`, bootstrap also creates six numbered subfolders — `01-Templates` through `06-Projects` — for product docs, market context, ICP, workspace config, and active projects.

---

## Step 5 — Connect your MCP servers (only what you need)

Skills work without any MCP server if you paste content into chat. To get auto-pulled data, configure MCP servers in your Claude Code MCP settings (`~/.claude.json` or `/mcp` in Claude Code). Common ones:

| Tool category | Example servers | Used by |
|---|---|---|
| Tracker (backlog, releases) | Monday, Jira, Linear, Notion | 01, 02, 09 |
| Analytics | Mixpanel, Amplitude, PostHog | 02, 06, 07, 08 |
| Docs / drives | Notion, Google Drive | 01, 09 |
| Email / calendar | Gmail, Outlook, Google Calendar | 01 |

Set them up via Claude Code's MCP configuration (see [MCP docs](https://docs.claude.com/en/docs/claude-code/mcp)), then record their names in `Knowledge/workspace-tools.md` so the skills know which one to call.

**You can skip this step entirely** for a first test run — pasting content directly into Claude Code works for all skills.

---

## Step 6 — Verify with your first skill

Open Claude Code in your workspace root. If you ran `/00-onboarding`, use the slash command it recommended. Otherwise, try a no-MCP-required smoke test:

```
/05-create-prd
```

The skill should ask for a feature brief (people problem + 2–5 pieces of evidence). Paste a short problem statement and confirm Claude writes a PRD under `Outputs/Product PRDs/`. If that works, the plugin is wired up correctly.

For a richer test, try `/01-customer-discovery` with a tracker MCP configured (it'll ask which board to read from).

---

## Step 7 — (Optional) Set up skill 11 (competitor analysis)

> Skip this step entirely if you don't plan to use skill 11. The other 10 skills work without it.
>
> Just want to *try* skill 11? The Taskley practice workspace (Step 3c) ships pre-captured `competitor-flows/`, so you can run `/11` against it without Node, CloakBrowser, or any competitor logins. This step is only for running it against live competitors of your own.

Skill 11 captures logged-in competitor product UI via [CloakBrowser](https://cloakbrowser.dev/) so it can compare a feature across multiple competitors. It needs Node.js and a one-time browser download — the plugin can't bundle these for you.

### 7a. Check Node.js is installed

In your terminal, run:

```bash
node --version
```

You need **v18.0.0 or newer** on **macOS or Windows** (Linux isn't supported by CloakBrowser yet). If `node` is missing or too old, install/update it from [nodejs.org](https://nodejs.org/) first.

### 7b. Run the skill 11 setup helper

The plugin ships a one-command setup script. Run it from any terminal:

```bash
bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/bin/setup-skill-11.sh
```

It will:

1. Install the Node packages skill 11 depends on.
2. Download the CloakBrowser binary for your OS.
3. Create a starter `Knowledge/competitors.md` in your workspace (if you run the script from inside your workspace folder and the file doesn't exist yet).
4. Print next steps for logging in to each competitor.

Expect 1–2 minutes for the npm install, plus a download for the browser binary.

### 7c. Tell skill 11 which competitors to track

Open `Knowledge/competitors.md` in your **workspace folder** (the one you bootstrapped in Step 3 — not the plugin folder). The setup helper in 7b creates this file with `[FILL]` placeholders if it doesn't exist yet — replace them with your product slug/name and each competitor's slug, login URL, and plan tier.

If the file wasn't created (e.g. you ran setup from outside your workspace), `cd` to your workspace and re-run the 7b command, or copy `templates/Knowledge/competitors.md.template` from the plugin into `Knowledge/competitors.md` yourself.

### 7d. Log in to each competitor once

For each competitor in your list, run this once per competitor (replace `<slug>` and `<url>`):

```bash
npm --prefix ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/skills/11-competitor-feature-analysis run competitor-login -- --competitor <slug> --verify "<url>"
```

A browser window opens — log in like a normal user. The session is saved so the skill can re-enter as you next time.

### 7e. Use the skill

Inside Claude Code in your workspace folder:

```
/11-competitor-feature-analysis
```

Or from a terminal:

```bash
npm --prefix ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/skills/11-competitor-feature-analysis run competitor-research -- --feature "<name>"
```

Full skill 11 walkthrough with all flags and outputs: [`skills/11-competitor-feature-analysis/INSTALL.md`](skills/11-competitor-feature-analysis/INSTALL.md).

---

## Updating

When this plugin gets new skills or fixes, from a terminal:

```bash
claude plugin marketplace update builderos-pm
claude plugin update builderos-pm-skills@builderos-pm
```

(or inside Claude Code: `/plugin update builderos-pm-skills@builderos-pm`).

Restart Claude Code to apply.

---

## Uninstalling

```bash
claude plugin uninstall builderos-pm-skills
claude plugin marketplace remove builderos-pm
```

Your `CLAUDE.md`, `Knowledge/`, `Outputs/`, and `Learnings/` content stays put — those live in your workspace, not the plugin.

---

## Troubleshooting

**`command not found: claude` (or `'claude' is not recognized`)**
The installer puts `claude` at `~/.local/bin/claude` (macOS/Linux) or `%USERPROFILE%\.local\bin\claude.exe` (Windows). If that folder isn't on your PATH, the shell won't find it even though install succeeded.

Check if the binary is there:

```bash
ls ~/.local/bin/claude          # macOS / Linux
```

```powershell
Test-Path "$env:USERPROFILE\.local\bin\claude.exe"   # Windows
```

- **File missing** → [install Claude Code](https://docs.claude.com/en/docs/claude-code), then retry.
- **File exists** → add the install dir to PATH (one-time), then open a new terminal:

**macOS (zsh):**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux (bash):**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**

```powershell
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
[Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
```

Restart the terminal, then run `claude --version` again. More detail: [Claude Code install troubleshooting](https://code.claude.com/docs/en/troubleshoot-install).

**`/plugin isn't available in this environment`**
You're typing into a Claude UI that doesn't support plugins. Plugins only work in Claude Code:

| Where you're typing | Does `/plugin` work? |
|---|---|
| Claude Code in a terminal (`claude` CLI) | ✅ |
| Claude Code IDE extension (VS Code, JetBrains) | ✅ |
| Claude desktop chat app (Mac/Windows) | ❌ |
| claude.ai in your browser | ❌ |

The fix is the same regardless: open a terminal and use the `claude plugin marketplace add …` / `claude plugin install …` shell commands from Steps 1–2. Skills installed that way work in any Claude Code session afterwards.

**"That's a Claude Code CLI command — you need to run it directly in your terminal" (or similar wording from Claude)**
You pasted a `claude plugin …` shell command into a Claude conversation. Those commands run on **your computer's shell**, not inside Claude. Open your terminal app (Step 0), paste the same command at the shell prompt (the `$` or `%` line), and press Enter.

**`Permission denied (publickey)` when installing**
The marketplace's `source.url` is HTTPS, so this shouldn't happen on a clean install. If you see this, check that your `marketplace.json` cache wasn't stale — run `claude plugin marketplace update builderos-pm` and re-install.

**Plugin installed but `/01-...` slash commands don't appear**
Restart Claude Code. Slash commands from new plugins are picked up on startup. If they still don't appear, check `claude plugin list` shows the plugin as `✔ enabled` and re-run `claude plugin enable builderos-pm-skills`.

**Skill complains about a missing MCP server**
The skill reads `Knowledge/workspace-tools.md` for MCP server names. Either fill the relevant section in or paste content directly into chat instead of asking the skill to fetch it.

**Skill 11: `npm run competitor-setup` fails on Linux**
CloakBrowser only ships macOS and Windows binaries today. Skill 11 won't work on Linux. The other 10 skills work everywhere.

**A skill produces blank/empty output**
Check `CLAUDE.md` exists at your workspace root and isn't full of unfilled `[BRACKETED]` placeholders. Most skills read it as required context. Run `/00-onboarding` to fill gaps conversationally.

**`/00-onboarding` doesn't appear in the slash menu**
Restart Claude Code after updating the plugin. Run `claude plugin list` to confirm `builderos-pm-skills` is enabled, then `claude plugin update builderos-pm-skills@builderos-pm`.

---

## Where files live

| What | Where |
|------|-------|
| Plugin code (read-only) | `~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/1.0.0/` |
| Marketplace registry | `~/.claude/plugins/known_marketplaces.json` |
| Your PM context | `<workspace>/CLAUDE.md` |
| Knowledge layout | `<workspace>/Knowledge/01-Templates/` … `06-Projects/` (product, market, ICP, tools, projects) |
| MCP/tool config | `<workspace>/Knowledge/workspace-tools.md` |
| Onboarding summary | `<workspace>/Knowledge/onboarding-summary.md` |
| Onboarding resume state | `<workspace>/Knowledge/onboarding-state.json` |
| Competitor list (skill 11) | `<workspace>/Knowledge/competitors.md` |
| Generated PRDs / TDDs | `<workspace>/Outputs/` |
| Analysis memos (skill 14) | `<workspace>/Outputs/Analytics/` |
| Retros / learnings | `<workspace>/Learnings/` |
| Skill 11 cache + reports | `<workspace>/Knowledge/competitor-flows/`, `<workspace>/Outputs/competitor-research/` |

---

## What's next

- Browse the skill table in [README.md](README.md) for what each skill does.
- Open any `skills/<name>/SKILL.md` to read the exact instructions Claude follows.
- File issues at [github.com/ranerez1/builderos-pm-skills/issues](https://github.com/ranerez1/builderos-pm-skills/issues).
