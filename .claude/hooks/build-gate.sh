#!/usr/bin/env bash
# Build-gate Stop hook.
#
# When a session ends with uncommitted changes under src/, run the fast half
# of the build gate (typecheck + lint) and block the stop if it fails, so the
# agent fixes the breakage before finishing. "The build is the test."
#
# Scope: runs `tsc --noEmit` + `eslint` only. The full `pnpm build` is too slow
# to run on every Stop — it stays the manual / `/preflight` / `/deploy` gate.
# Skips entirely on turns that didn't touch src/ (conversation, docs, config).
set -uo pipefail

payload="$(cat)"

# Re-entrancy guard: if this stop is already the result of a prior build-gate
# block, don't loop.
if printf '%s' "$payload" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

# Only gate when a code file under src/ changed (tracked or untracked).
# A docs/CLAUDE.md edit under src/ shouldn't trigger a typecheck.
if ! git status --porcelain -- src/ 2>/dev/null | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

tsc_out="$(pnpm exec tsc --noEmit 2>&1)"; tsc_rc=$?
lint_out="$(pnpm lint 2>&1)"; lint_rc=$?

if [ "$tsc_rc" -eq 0 ] && [ "$lint_rc" -eq 0 ]; then
  exit 0
fi

{
  echo "Build gate failed — src/ changed and the checks don't pass. Fix before finishing:"
  if [ "$tsc_rc" -ne 0 ]; then
    echo "── pnpm exec tsc --noEmit ──"
    printf '%s\n' "$tsc_out" | tail -n 40
  fi
  if [ "$lint_rc" -ne 0 ]; then
    echo "── pnpm lint ──"
    printf '%s\n' "$lint_out" | tail -n 40
  fi
  echo "Then run /preflight (lint + tsc + build) to confirm the full gate."
} >&2
exit 2
