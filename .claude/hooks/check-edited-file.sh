#!/usr/bin/env bash
# PostToolUse hook: formats the file that was just written and reports any
# lint/type error straight back to the agent, so mistakes surface within
# seconds instead of in CI.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -d node_modules ] || exit 0

file=$(node -e '
let d = ""
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  try {
    console.log(JSON.parse(d).tool_input?.file_path ?? "")
  } catch {
    console.log("")
  }
})')

[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *node_modules*|*/.next/*|*/.agents/*|*/coverage/*) exit 0 ;;
esac

npx --no-install prettier --write "$file" >/dev/null 2>&1

problems=""
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs)
    if ! eslint_out=$(npx --no-install eslint "$file" 2>&1); then
      problems+="ESLint:"$'\n'"$eslint_out"$'\n'
    fi
    ;;
esac

case "$file" in
  *.ts|*.tsx)
    if ! tsc_out=$(npx --no-install tsc 2>&1); then
      problems+="TypeScript:"$'\n'"$tsc_out"$'\n'
    fi
    ;;
esac

if [ -n "$problems" ]; then
  printf '%s\n' "$problems" >&2
  printf 'Fix these before continuing.\n' >&2
  exit 2
fi

exit 0
