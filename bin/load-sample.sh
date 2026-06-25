#!/usr/bin/env bash
# Loads the optional "Taskley" practice workspace into the current folder.
#
# This is NOT part of normal setup — it's only for trying the skills against a
# ready-made sample product. Run it from a FRESH, throwaway workspace folder so the
# sample never mixes with your real work.
#
# It copies templates/sample-workspace/Knowledge/* into ./Knowledge/, skipping any file
# that already exists (so it never clobbers your content).
#
# Usage:
#   mkdir -p ~/Documents/pm-practice && cd ~/Documents/pm-practice
#   bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/load-sample.sh

set -euo pipefail

# Resolve the directory this script lives in, then jump one level up to find templates/.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
SAMPLE_DIR="$PLUGIN_DIR/templates/sample-workspace/Knowledge"

if [ ! -d "$SAMPLE_DIR" ]; then
  echo "✗ Couldn't find the sample workspace."
  echo "  Looked at: $SAMPLE_DIR"
  echo "  Are you running this from inside the plugin install? See INSTALL.md Step 3e."
  exit 1
fi

WORKSPACE="$(pwd)"
echo "Loading the Taskley practice workspace into: $WORKSPACE"
echo

copied=()
skipped=()

# Walk every file under the sample's Knowledge/ and mirror it into ./Knowledge/,
# copy-if-missing so existing files are never overwritten.
while IFS= read -r -d '' src; do
  rel="${src#"$SAMPLE_DIR"/}"
  dest="Knowledge/$rel"
  if [ -e "$dest" ]; then
    skipped+=("$dest")
    continue
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  copied+=("$dest")
done < <(find "$SAMPLE_DIR" -type f -print0)

if [ "${#copied[@]}" -gt 0 ]; then
  echo "✓ Added ${#copied[@]} file(s):"
  for f in "${copied[@]}"; do echo "    $f"; done
else
  echo "• Nothing added — every sample file already exists here."
fi

if [ "${#skipped[@]}" -gt 0 ]; then
  echo
  echo "• Skipped ${#skipped[@]} file(s) that already existed (left untouched):"
  for f in "${skipped[@]}"; do echo "    $f"; done
fi

echo
echo "Note: this loads sample Knowledge content only. Per-folder README rubrics and"
echo "CLAUDE.md come from bin/bootstrap.sh — run that first if you want the full scaffold."
echo
echo "Next — open this folder in Claude Code and try:"
echo "  • /05-create-prd                  (drafts a PRD from the Taskley product Knowledge)"
echo "  • /07-ui-ux-review                (reviews Knowledge/06-Projects/Taskley-App/index.html)"
echo "  • /11-competitor-feature-analysis (uses the bundled competitor-flows/ — no logins needed)"
echo
echo "When you're done practicing, just delete this folder."
