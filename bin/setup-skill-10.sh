#!/usr/bin/env bash
# Deprecation stub for the old setup-skill-10.sh path.
# In v1.0.0 the competitor-analysis skill was renumbered 10 → 11.
# The setup helper moved with it: bin/setup-skill-11.sh.
#
# This stub is shipped for one release so older READMEs and notes that
# reference the old path still print a useful message instead of "file not found".
# It will be removed in a future version.

cat <<'EOF'
⚠ This script was renamed in v1.0.0.

The competitor-analysis skill is now skill 11 (was skill 10), and its setup
helper is:

    bash ~/.claude/plugins/cache/builderos-pm/builderos-pm-skills/<version>/bin/setup-skill-11.sh

Running setup-skill-11.sh now...

EOF

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
exec bash "$SCRIPT_DIR/setup-skill-11.sh" "$@"
