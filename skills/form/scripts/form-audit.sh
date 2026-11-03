#!/usr/bin/env bash
set -euo pipefail

# 全局审计器不把 --exclude 应用于 data/ 的最终检查；本库不再豁免 data/ 中的运行时 JSON。
GLOBAL_FORM_ROOT=${FORM_GLOBAL_SKILL_ROOT:-/root/configure/skills/form}
GLOBAL_AUDIT="$GLOBAL_FORM_ROOT/scripts/form-audit.sh"
ALLOWED_LOGS=$'^WARNING\tLOG_EXTENSION\tlogs/AGENTS\\.md\t'

output=$(mktemp)
filtered=$(mktemp)
trap 'rm -f "$output" "$filtered"' EXIT

set +e
FORM_ALLOWED_TOP_DIRS="${FORM_ALLOWED_TOP_DIRS:+$FORM_ALLOWED_TOP_DIRS:}custom" \
  "$GLOBAL_AUDIT" "$@" >"$output"
audit_rc=$?
set -e

if [[ -s "$output" ]]; then
  grep -Ev "$ALLOWED_LOGS" "$output" >"$filtered" || true
else
  : >"$filtered"
fi

cat "$filtered"
if [[ -s "$filtered" ]]; then
  exit "$audit_rc"
fi

# 唯一失败来源若是已登记的日志元数据例外，则视为通过；usage/内部错误仍原样返回。
if ((audit_rc > 1)); then
  exit "$audit_rc"
fi
exit 0
