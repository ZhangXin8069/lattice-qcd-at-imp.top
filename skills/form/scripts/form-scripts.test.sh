#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

[[ -n "$("$SCRIPT_DIR/form-audit.sh" --help)" ]] || fail "form-audit.sh --help 无输出"
[[ -n "$("$SCRIPT_DIR/form-snapshot-verify.sh" --help)" ]] || fail "form-snapshot-verify.sh --help 无输出"

audit_output=$(FORM_SKILL_DIR="$REPO_ROOT/skills/form" \
  "$SCRIPT_DIR/form-audit.sh" --root "$REPO_ROOT" --strict)
[[ -z "$audit_output" ]] || fail "仓库严格审计存在未登记发现：$audit_output"
"$SCRIPT_DIR/form-snapshot-verify.sh" --quiet ||
  fail "参考快照校验未通过"

printf 'form script tests: PASS\n'
