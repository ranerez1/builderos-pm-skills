# Install — 10 Competitor Feature Analysis

Portable Claude Code skill. Captures logged-in competitor product UI via CloakBrowser, discovers
screen-by-screen flows, compares a feature across competitors, and generates a report + HTML deck.

## Install into a workspace

1. **Unzip into the workspace's skills directory** so the folder lands at:
   ```
   <workspace>/.claude/skills/10-competitor-feature-analysis/
   ```
   (e.g. `unzip 10-competitor-feature-analysis.zip -d .claude/skills`)

2. **Install dependencies** (native CloakBrowser/Playwright deps — not bundled):
   ```bash
   cd .claude/skills/10-competitor-feature-analysis && npm install && cd -
   ```

3. **Download the browser binary** for this OS:
   ```bash
   npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-setup
   ```

4. **Create `Knowledge/competitors.md`** at the workspace root. Run `competitor-setup` first — if the
   file is missing, the skill prints the template to fill in (slug, login URL, plan tier per competitor).

5. **Log in once per competitor** (interactive terminal — a browser window opens):
   ```bash
   npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-login -- \
     --competitor <slug> --verify "<feature-app-url>"
   ```

## Run

```bash
npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-research -- --feature "<name>"
```

Then follow `SKILL.md` (exit-code-driven: `0` analyze · `2` auth · `3` discover · `1` fix flow), or
invoke `/10-competitor-feature-analysis` in Claude Code.

## How it stays portable

- Every script runs through this folder's own `package.json` (`npm --prefix … run competitor-*`), so
  **no edits to the workspace root `package.json` are needed**.
- The workspace root is auto-detected by walking up for a `.git/` or `package.json` marker
  (`scripts/lib/paths.mjs` → `findRepoRoot()`), so outputs land at the workspace root from any cwd.
- Outputs are written under the workspace root:
  - Flow cache → `Knowledge/competitor-flows/{feature}/{competitor}.{json,flow.md}`
  - Screenshots + report → `Outputs/competitor-research/{feature}-{date}/`
  - Browser profiles → `.cloak-profiles/` (gitignore this)

**Optional shortcut:** to use bare `npm run competitor-*` from the workspace root, copy the `scripts`
block from this folder's `package.json` into the workspace root `package.json`, prefixing each path
with `.claude/skills/10-competitor-feature-analysis/`.

## Requirements

- Node.js 18+ and npm.
- macOS or Windows (CloakBrowser binary platforms; see https://cloakbrowser.dev/).
