#!/usr/bin/env bash
# Validate a BuilderOS PM Skills workspace.
#
# Checks required folders and flags unfilled placeholders in CLAUDE.md
# and Knowledge/workspace-tools.md.
#
# Usage (from workspace root):
#   bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/validate-workspace.sh
#
# Exit 0 if good enough to run skills; exit 1 with a gap list otherwise.

set -euo pipefail

WORKSPACE="$(pwd)"
gaps=()
warnings=()

echo "Validating workspace: $WORKSPACE"
echo

# Required directories
for d in Knowledge Outputs Learnings; do
  if [ ! -d "$d" ]; then
    gaps+=("Missing directory: $d/")
  fi
done

KNOWLEDGE_SUBDIRS=(
  01-Templates
  02-Product-Knowledge
  03-Market-Knowledge
  04-ICP
  05-Workspace-Tools
  06-Projects
)
missing_knowledge_subdirs=()
for sub in "${KNOWLEDGE_SUBDIRS[@]}"; do
  if [ ! -d "Knowledge/$sub" ]; then
    missing_knowledge_subdirs+=("Knowledge/$sub/")
  fi
done
if [ "${#missing_knowledge_subdirs[@]}" -gt 0 ]; then
  warnings+=("Missing Knowledge subfolders (run bootstrap to create): ${missing_knowledge_subdirs[*]}")
fi

# CLAUDE.md
if [ ! -f "CLAUDE.md" ]; then
  gaps+=("Missing CLAUDE.md at workspace root")
else
  if grep -qE '\[[A-Za-z /]+\]' CLAUDE.md 2>/dev/null; then
    placeholders=$(grep -oE '\[[A-Za-z0-9 /._-]+\]' CLAUDE.md | sort -u | tr '\n' ', ' | sed 's/,$//')
    warnings+=("CLAUDE.md has unfilled placeholders: $placeholders")
  fi
fi

# workspace-tools.md
if [ ! -f "Knowledge/workspace-tools.md" ]; then
  gaps+=("Missing Knowledge/workspace-tools.md")
else
  if grep -qE '<(paste link|id-or-empty|mcp-server-name|one or more)' Knowledge/workspace-tools.md 2>/dev/null; then
    warnings+=("Knowledge/workspace-tools.md has template placeholders (some tool sections may be unconfigured)")
  fi
fi

# Report
if [ "${#gaps[@]}" -gt 0 ]; then
  echo "✗ Gaps found:"
  for g in "${gaps[@]}"; do
    echo "  - $g"
  done
  echo
fi

if [ "${#warnings[@]}" -gt 0 ]; then
  echo "⚠ Warnings:"
  for w in "${warnings[@]}"; do
    echo "  - $w"
  done
  echo
fi

if [ "${#gaps[@]}" -gt 0 ]; then
  echo "Run bootstrap or /00-onboarding to fix missing files."
  exit 1
fi

if [ "${#warnings[@]}" -gt 0 ]; then
  echo "✓ Workspace structure OK. Some placeholders remain — run /00-onboarding or edit files manually."
  exit 0
fi

echo "✓ Workspace looks ready."
exit 0
