#!/usr/bin/env bash
set -euo pipefail

GLOBAL_FORM_ROOT=${FORM_GLOBAL_SKILL_ROOT:-/root/configure/skills/form}
GLOBAL_VERIFY="$GLOBAL_FORM_ROOT/scripts/form-snapshot-verify.sh"

exec "$GLOBAL_VERIFY" "$@"
