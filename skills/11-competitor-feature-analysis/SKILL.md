---
name: 10-competitor-feature-analysis
description: Captures logged-in competitor product UI via CloakBrowser, compares a specific feature across competitors from Knowledge/competitors.md, saves screenshots and a neutral comparison report under Outputs/competitor-research/, and generates HTML presentations plus optional value-ranked gap analysis. Use when the user runs /10-competitor-feature-analysis, asks to compare a competitor feature, product research with screenshots, gap analysis, or analyze how competitors implement a capability.
disable-model-invocation: true
---

# 10 Competitor Feature Analysis

## Role

Neutral product researcher: compare one **feature** across competitors using logged-in UI flows, screenshots, and public docs when needed.

## Invocation

All `competitor-*` scripts run through the skill's own `package.json`, so the skill is portable and
needs no workspace-root setup. Run every command as:

```
npm --prefix .claude/skills/10-competitor-feature-analysis run <script> -- <args>
```

The shorthand `npm run competitor-*` below is that command with the `--prefix` omitted; expand it as
above unless the workspace root `package.json` also defines these scripts. Output paths resolve to the
workspace root (auto-detected via `.git`/`package.json`) regardless of where you invoke from.

## Agent playbook (ordered)

1. **Gate** — `Knowledge/competitors.md` complete (no `[FILL]`). Else show template and **stop**.
2. **Orchestrator** — `npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-research -- --feature "<name>"` → read **exit code** (not JSON archaeology):
   - `0` — replays OK → analysis
   - `2` — auth → give user `competitor-login --verify <feature-url>` and **stop**
   - `3` — discovery required → discover loop per competitor
   - `1` — replay failed → fix flow cache or re-discover
3. **Discover** (per competitor in manifest) — use **feature URL** from manifest, not login URL:
   - `launch` → daemon browser starts (default)
   - `snapshot --scroll` → `click` / `goto` / `hover` → `capture-screen` per screen
   - `save-flow --run-dir <run-dir>` → `close`
4. **Re-run research** until exit `0`.
5. **Scaffold** — `npm run competitor-scaffold-report -- --manifest <run-dir>/capture-manifest.json`
6. **Fill PM content** — summary, keyInsights, capabilities in scaffold JSON/MD.
7. **HTML** — `npm run competitor-presentation -- --data ...`

**Never** write one-off capture scripts. If discover fails, use `goto`, `hover`, or `--no-daemon` debug — file infra issue.

## Setup & auth (once per org)

```bash
cd .claude/skills/10-competitor-feature-analysis && npm install && cd -
npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-setup
npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-login -- --competitor <slug> --verify "<feature-app-url>"
```

Login in **user's interactive terminal**. Exit **2** → stop and give `competitor-login` command.

## Navigation strategies

| Strategy | When | How |
|----------|------|-----|
| `click` | Stable buttons/links in snapshot | `click --role link --name "..."` |
| `goto` | SPA routes; clicks fail | `goto --url` or `capture-screen --url` |
| `hover-click` | Edit pencils, ⋯ menus | `hover --ref @eN` then `click` |

Prefer **click locators** in flow cache for portable replay. Use `goto` for evidence only when clicks are unreliable. Mark branch screens `--optional --condition plan-gated`.

## Orchestrator flags

`--discover-only` · `--replay-only` · `--force-discover` · `--pattern list-and-detail`

## Discover commands

`launch` · `snapshot` · `click` · `hover` · `fill` · `press` · `goto` · `capture-screen` · `save-flow` · `close`

Daemon mode is default (fast). `--no-daemon` for debug (slow, replays full history per command).

## Outputs

| Artifact | Path |
|----------|------|
| Flow cache | `Knowledge/competitor-flows/{feature-slug}/{competitor}.{json,flow.md}` |
| Manifest | `{run-dir}/capture-manifest.json` |
| Screenshots | `{run-dir}/screenshots/{competitor}-{state}.png` |
| Report / JSON / HTML | `{run-dir}/{feature-slug}-comparison-{date}.{md,json,html}` |

## Reference

Full schema, troubleshooting, report template: [reference.md](reference.md).
