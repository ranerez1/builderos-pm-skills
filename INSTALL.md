# Install — BuilderOS PM Skills

A step-by-step walkthrough to install this plugin and run your first skill. Estimated time: 5 minutes (or 15 minutes if you also set up skill 10's competitor capture).

---

## Before you start: which Claude is this for?

**Plugins only work in Claude Code.** They do **not** work in the regular Claude chat app.

| Where you're typing | Does `/plugin` work? | What to do |
|---|---|---|
| **Claude Code in a terminal** (`claude` CLI) | ✅ Yes | Use the `/plugin …` slash commands in this guide, or the equivalent `claude plugin …` shell commands. |
| **Claude Code IDE extension** (VS Code, JetBrains) | ✅ Yes | Use the `/plugin …` slash commands in Claude Code's panel. |
| **Claude desktop app** (the chat app on Mac/Windows) | ❌ No | Use the **shell commands** in this guide from a terminal (`claude plugin …`). |
| **claude.ai in your browser** | ❌ No | Same — install from a terminal. |

If you typed `/plugin marketplace add …` and saw **"`/plugin` isn't available in this environment"**, you're in the chat app, not Claude Code. Switch to a terminal and use the `claude plugin …` form shown in each step below.

> **Quick check:** open a terminal and run `claude --version`. If it prints a version, Claude Code is installed and the shell commands in this guide will work regardless of which Claude UI you usually chat in.

## Prerequisites

- **Claude Code** installed and authenticated. ([install guide](https://docs.claude.com/en/docs/claude-code)) — this is a separate install from the Claude desktop chat app.
- A **terminal app** (see Step 0 below if you're not sure what that means).
- A workspace folder where you want to use the skills (your product repo, a PM scratch dir, anything).

Optional, per skill:
- MCP servers for your tracker / analytics / docs tools (Monday, Mixpanel, Notion, Gmail, etc.) — only needed for skills that pull live data.
- Node.js 18+ on macOS or Windows — only for skill 10 (competitor analysis).

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

If it prints a version number, you're good. If it says "command not found", finish [installing Claude Code](https://docs.claude.com/en/docs/claude-code) first.

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

**What just happened:** Claude Code cloned this repo into `~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/0.2.0/`. The 10 skills under `skills/*/SKILL.md` are now discoverable as slash commands (`/01-customer-discovery` through `/10-competitor-feature-analysis`) and auto-triggered by the model when relevant.

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
bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/0.2.0/bin/bootstrap.sh
```

You'll see output like:

```
✓ Created Knowledge/, Outputs/, Learnings/
✓ Copied CLAUDE.md (PM context — edit this next)
✓ Copied Knowledge/workspace-tools.md (tool config — edit this next)

Next: open CLAUDE.md and Knowledge/workspace-tools.md in your editor and fill in your details.
```

> If it says "No such file or directory", your plugin cache is at a different path. Run `claude plugin list` to see the installed version, then replace `0.2.0` in the command above with whatever version it shows. Or paste the manual block at the bottom of this step.

### 3c. Edit the two starter files

Open them in any text editor (TextEdit, VS Code, Cursor, vim — your call):

- **`CLAUDE.md`** — fill in the `[BRACKETED]` placeholders: your role, company, product, primary metric. Delete anything that doesn't apply. This is the context every skill reads first.
- **`Knowledge/workspace-tools.md`** — fill in your tracker / analytics / docs tool names and the MCP server names that connect to them. Skip the sections you don't have — the skills that need a missing tool will tell you what's missing.

That's it. The `Outputs/`, `Learnings/`, and `Knowledge/` folders the bootstrap created are where skills will save PRDs, retros, and reference docs as you use them.

<details>
<summary><strong>Manual alternative (if the bootstrap script doesn't work)</strong></summary>

From your workspace folder, run these four lines:

```bash
mkdir -p Knowledge Outputs Learnings
cp ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/0.2.0/templates/CLAUDE.md.template ./CLAUDE.md
cp ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/0.2.0/templates/Knowledge/workspace-tools.md.template Knowledge/workspace-tools.md
ls -la
```

The last `ls -la` lists the folder so you can confirm `CLAUDE.md`, `Knowledge/`, `Outputs/`, and `Learnings/` are there. Then edit `CLAUDE.md` and `Knowledge/workspace-tools.md` per 3c.

</details>

---

## Step 4 — Connect your MCP servers (only what you need)

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

## Step 5 — Verify with your first skill

Open Claude Code in your workspace root. Try a no-MCP-required smoke test:

```
/05-prd-to-tech-plan
```

The skill should prompt you for the PRD content or a path. Paste a one-paragraph problem statement and confirm Claude generates a Technical Design Doc under `Outputs/Technical Docs/`. If that works, the plugin is wired up correctly.

For a richer test, try `/01-customer-discovery` with a tracker MCP configured (it'll ask which board to read from).

---

## Step 6 — (Optional) Set up skill 10 (competitor analysis)

Skill 10 captures logged-in competitor product UI via [CloakBrowser](https://cloakbrowser.dev/) and compares features across competitors. It has native dependencies the plugin can't auto-install.

```bash
PLUGIN_DIR=~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/0.2.0
cd "$PLUGIN_DIR/skills/10-competitor-feature-analysis"

# Install Node deps
npm install

# Download the CloakBrowser binary for your OS
npm run competitor-setup
```

Then, in your **workspace root** (not the plugin dir), create `Knowledge/competitors.md` listing the competitors you want to track. Running `competitor-setup` once with no file present prints a template you can fill in.

Full skill 10 walkthrough is in [`skills/10-competitor-feature-analysis/INSTALL.md`](skills/10-competitor-feature-analysis/INSTALL.md).

**Requirements**: Node 18+, macOS or Windows (CloakBrowser binary platforms).

---

## Updating

When this plugin gets new skills or fixes, from a terminal:

```bash
claude plugin marketplace update builderos-pm
claude plugin update builderos-pm-skills
```

(or inside Claude Code: `/plugin update builderos-pm-skills`).

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

**`/plugin isn't available in this environment`**
You're typing into the Claude desktop **chat** app or claude.ai, neither of which supports plugins. Open a terminal and use `claude plugin marketplace add …` and `claude plugin install …` instead — the skills will then be available in any Claude Code session (CLI or IDE) on that machine. The chat app itself still can't run them.

**"That's a Claude Code CLI command — you need to run it directly in your terminal" (or similar wording from Claude)**
You pasted a `claude plugin …` shell command into a Claude conversation. Those commands run on **your computer's shell**, not inside Claude. Open your terminal app (Step 0), paste the same command at the shell prompt (the `$` or `%` line), and press Enter.

**`Permission denied (publickey)` when installing**
The marketplace's `source.url` is HTTPS, so this shouldn't happen on a clean install. If you see this, check that your `marketplace.json` cache wasn't stale — run `claude plugin marketplace update builderos-pm` and re-install.

**Plugin installed but `/01-...` slash commands don't appear**
Restart Claude Code. Slash commands from new plugins are picked up on startup. If they still don't appear, check `claude plugin list` shows the plugin as `✔ enabled` and re-run `claude plugin enable builderos-pm-skills`.

**Skill complains about a missing MCP server**
The skill reads `Knowledge/workspace-tools.md` for MCP server names. Either fill the relevant section in or paste content directly into chat instead of asking the skill to fetch it.

**Skill 10: `npm run competitor-setup` fails on Linux**
CloakBrowser only ships macOS and Windows binaries today. Skill 10 won't work on Linux. The other 9 skills work everywhere.

**A skill produces blank/empty output**
Check `CLAUDE.md` exists at your workspace root and isn't full of unfilled `[BRACKETED]` placeholders. Most skills read it as required context.

---

## Where files live

| What | Where |
|------|-------|
| Plugin code (read-only) | `~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/0.2.0/` |
| Marketplace registry | `~/.claude/plugins/known_marketplaces.json` |
| Your PM context | `<workspace>/CLAUDE.md` |
| MCP/tool config | `<workspace>/Knowledge/workspace-tools.md` |
| Generated PRDs / TDDs | `<workspace>/Outputs/` |
| Retros / learnings | `<workspace>/Learnings/` |
| Skill 10 cache + reports | `<workspace>/Knowledge/competitor-flows/`, `<workspace>/Outputs/competitor-research/` |

---

## What's next

- Browse the skill table in [README.md](README.md) for what each skill does.
- Open any `skills/<name>/SKILL.md` to read the exact instructions Claude follows.
- File issues at [github.com/ranerez1/builderos-pm-skills/issues](https://github.com/ranerez1/builderos-pm-skills/issues).
