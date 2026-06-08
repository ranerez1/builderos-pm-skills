#!/usr/bin/env bash
# Setup helper for skill 10 (competitor analysis).
#
# Installs the Node dependencies and downloads the CloakBrowser binary that
# skill 10 needs. Safe to re-run — npm is idempotent.
#
# Usage:
#   bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/setup-skill-10.sh

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_DIR="$PLUGIN_DIR/skills/10-competitor-feature-analysis"

if [ ! -d "$SKILL_DIR" ]; then
  echo "✗ Couldn't find skill 10 at: $SKILL_DIR"
  echo "  Is the plugin installed? See INSTALL.md Steps 1–2."
  exit 1
fi

# Sanity-check Node.
if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js isn't installed."
  echo "  Skill 10 needs Node 18 or newer. Install from https://nodejs.org/ then re-run."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node $(node -v) is too old. Skill 10 needs Node 18 or newer."
  echo "  Update from https://nodejs.org/ then re-run."
  exit 1
fi

echo "Setting up skill 10 in: $SKILL_DIR"
echo "Using Node $(node -v)"
echo

cd "$SKILL_DIR"

echo "→ Installing Node dependencies (this may take a minute)..."
npm install --silent
echo "✓ Dependencies installed"
echo

echo "→ Downloading the CloakBrowser binary for your OS..."
npm run competitor-setup
echo
echo "✓ Skill 10 is ready."
echo
echo "Next:"
echo "  1. cd back to your workspace folder."
echo "  2. Create Knowledge/competitors.md listing the competitors you want to track."
echo "     (If you skip this and run a competitor command, the skill will print a template you can fill in.)"
echo "  3. Log in to each competitor once with:"
echo "     npm --prefix \"$SKILL_DIR\" run competitor-login -- --competitor <slug> --verify \"<url>\""
echo "  4. Then run /10-competitor-feature-analysis inside Claude Code."
echo
echo "Full skill 10 walkthrough: $SKILL_DIR/INSTALL.md"
