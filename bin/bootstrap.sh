#!/usr/bin/env bash
# Bootstrap helper for BuilderOS PM Skills.
#
# Run this from your workspace folder. It will:
#   1. Create Knowledge/, Outputs/, Learnings/ folders if missing.
#   2. Copy CLAUDE.md from the plugin's template (skip if you already have one).
#   3. Copy Knowledge/workspace-tools.md from the plugin's template (skip if you already have one).
#
# Usage:
#   bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/bootstrap.sh

set -euo pipefail

# Resolve the directory this script lives in, then jump one level up to find templates/.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$PLUGIN_DIR/templates"

if [ ! -d "$TEMPLATES_DIR" ]; then
  echo "✗ Couldn't find the plugin's templates/ folder."
  echo "  Looked at: $TEMPLATES_DIR"
  echo "  Are you running this from inside the plugin install? See INSTALL.md Step 3b."
  exit 1
fi

WORKSPACE="$(pwd)"
echo "Bootstrapping workspace: $WORKSPACE"
echo

# 1. Folders
made_dirs=()
for d in Knowledge Outputs Learnings; do
  if [ ! -d "$d" ]; then
    mkdir -p "$d"
    made_dirs+=("$d")
  fi
done
if [ "${#made_dirs[@]}" -gt 0 ]; then
  echo "✓ Created folders: ${made_dirs[*]}"
else
  echo "• All target folders already exist (Knowledge/, Outputs/, Learnings/)"
fi

# 2. CLAUDE.md
if [ -e "CLAUDE.md" ]; then
  echo "• CLAUDE.md already exists — leaving it alone"
else
  cp "$TEMPLATES_DIR/CLAUDE.md.template" "CLAUDE.md"
  echo "✓ Copied CLAUDE.md (PM context — edit this next)"
fi

# 3. Knowledge/workspace-tools.md
if [ -e "Knowledge/workspace-tools.md" ]; then
  echo "• Knowledge/workspace-tools.md already exists — leaving it alone"
else
  cp "$TEMPLATES_DIR/Knowledge/workspace-tools.md.template" "Knowledge/workspace-tools.md"
  echo "✓ Copied Knowledge/workspace-tools.md (tool config — edit this next)"
fi

echo
echo "Next:"
echo "  1. Open Claude Code in this folder and run /00-onboarding"
echo "     (guided setup for CLAUDE.md, workspace-tools.md, and your first skill)."
echo "  2. Or edit CLAUDE.md and Knowledge/workspace-tools.md manually."
echo "  3. Then try /05-create-prd to smoke-test."
