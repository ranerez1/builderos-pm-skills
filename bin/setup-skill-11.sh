#!/usr/bin/env bash
# Setup helper for skill 11 (competitor analysis).
#
# Installs the Node dependencies and downloads the CloakBrowser binary that
# skill 11 needs. Safe to re-run — npm is idempotent.
#
# Usage:
#   bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/setup-skill-11.sh

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_DIR="$PLUGIN_DIR/skills/11-competitor-feature-analysis"

if [ ! -d "$SKILL_DIR" ]; then
  echo "✗ Couldn't find skill 11 at: $SKILL_DIR"
  echo "  Is the plugin installed? See INSTALL.md Steps 1–2."
  exit 1
fi

# Sanity-check Node.
if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js isn't installed."
  echo "  Skill 11 needs Node 18 or newer. Install from https://nodejs.org/ then re-run."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node $(node -v) is too old. Skill 11 needs Node 18 or newer."
  echo "  Update from https://nodejs.org/ then re-run."
  exit 1
fi

WORKSPACE=""
if [ -d "Knowledge" ] || [ -f "CLAUDE.md" ]; then
  WORKSPACE="$(pwd)"
fi

echo "Setting up skill 11 in: $SKILL_DIR"
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
echo "✓ Skill 11 is ready."
echo

if [ -n "$WORKSPACE" ] && [ ! -f "$WORKSPACE/Knowledge/competitors.md" ]; then
  mkdir -p "$WORKSPACE/Knowledge"
  cp "$PLUGIN_DIR/templates/Knowledge/competitors.md.template" "$WORKSPACE/Knowledge/competitors.md"
  echo "✓ Created $WORKSPACE/Knowledge/competitors.md (starter template — edit next)"
  echo
elif [ -z "$WORKSPACE" ]; then
  echo "Tip: run this script from your workspace folder (the one with Knowledge/) to auto-create Knowledge/competitors.md."
  echo
fi

echo "Next:"
echo "  1. Open Knowledge/competitors.md in your workspace — replace every [FILL] (slug, login URL, plan tier per competitor)."
if [ -z "$WORKSPACE" ]; then
  echo "     (Not created yet? cd to your workspace and re-run this script, or copy templates/Knowledge/competitors.md.template from the plugin.)"
fi
echo "  2. Log in to each competitor once with:"
echo "     npm --prefix \"$SKILL_DIR\" run competitor-login -- --competitor <slug> --verify \"<url>\""
echo "  3. Then run /11-competitor-feature-analysis inside Claude Code."
echo
echo "Full skill 11 walkthrough: $SKILL_DIR/INSTALL.md"
