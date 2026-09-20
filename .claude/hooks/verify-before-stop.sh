#!/usr/bin/env bash
# Stop hook: refuses to let the agent finish while `npm run lint` or the test
# suite is red. CLAUDE.md asks for this; this makes it non-optional.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -d node_modules ] || exit 0

# Already inside a stop-hook continuation: let the agent finish to avoid a loop.
already_active=$(node -e '
let d = ""
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  try {
    console.log(JSON.parse(d).stop_hook_active === true ? "1" : "0")
  } catch {
    console.log("0")
  }
})')
[ "$already_active" = "1" ] && exit 0

# Nothing to verify if the working tree is untouched.
if git diff --quiet HEAD 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

problems=""
if ! lint_out=$(npm run lint 2>&1); then
  problems+="npm run lint failed:"$'\n'"$lint_out"$'\n'
fi

if ! test_out=$(npm run test 2>&1); then
  problems+="npm run test failed:"$'\n'"$test_out"$'\n'
fi

if [ -n "$problems" ]; then
  printf '%s\n' "$problems" >&2
  printf 'The working tree is not in a shippable state. Fix the above, then stop.\n' >&2
  exit 2
fi

exit 0
