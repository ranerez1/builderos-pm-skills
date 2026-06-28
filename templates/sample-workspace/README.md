# Taskley — practice workspace (sample)

This folder is a **ready-made practice workspace** for trying the BuilderOS PM skills
without touching your real work. It's modeled on a fictional task-management product
called **Taskley**.

It is **optional** and plays no part in a normal plugin install. You only get it if you
deliberately load it with `bin/load-sample.sh` (see [INSTALL.md](../../INSTALL.md),
Step 3c).

## What's inside (`Knowledge/`)

- `workspace-tools.md`, `competitors.md` — sample tool/competitor config
- `01-Templates/` — a PRD template
- `02-Product-Knowledge/` — Taskley company + product strategy
- `03-Market-Knowledge/` — competitive analysis
- `04-ICP/` — ideal customer profile
- `06-Projects/Taskley-App/` — a self-contained single-file web app (`index.html`)
- `competitor-flows/` — pre-captured Todoist/TickTick flows so `/11-competitor-feature-analysis`
  can be tried offline (no competitor logins needed)

## How to use it

From a **fresh, throwaway folder** (so it never mixes with real work):

```bash
mkdir -p ~/Documents/pm-practice && cd ~/Documents/pm-practice
bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/load-sample.sh
```

Then open that folder in Claude Code and try, for example:

- `/05-create-prd` — drafts a PRD from the Taskley product Knowledge
- `/07-ui-ux-review` — reviews `Knowledge/06-Projects/Taskley-App/index.html`
- `/11-competitor-feature-analysis` — uses the bundled `competitor-flows/`

When you're done, just delete the practice folder.
