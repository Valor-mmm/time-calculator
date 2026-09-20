# Tooling, CI and Operations

## npm scripts

```
npm run dev            next dev
npm run build          next build
npm run start          next start

npm run test           vitest run
npm run test:watch     vitest
npm run test:coverage  vitest run --coverage
npm run test:e2e       playwright test          (needs a build first)

npm run lint:format    prettier --check ./
npm run lint:es        eslint .                 (reports, does not fix)
npm run lint:ts        tsc                      (type-check only, noEmit)
npm run lint           all three                <- the gate
npm run fix            prettier --write && eslint --fix
npm run verify         lint + test + build

npm run prepare        husky                    (installs git hooks)
```

`npm run lint` is deliberately **non-mutating**, so it means the same thing
locally, in the pre-commit hook and in CI. Use `npm run fix` to apply fixes.

## Formatting and linting config

- **Prettier** (`.prettierrc.yaml`): no semicolons, single quotes,
  `endOfLine: auto`. `.prettierignore` excludes `.next`, `node_modules`,
  `next-env.d.ts`, `.junie/`, `.agents/`, the lockfile and all test output.
  Excluding `.agents/` matters: those are vendored third-party docs, and
  format-gating them made every Prettier bump break CI.
- **ESLint** (`eslint.config.mjs`): flat config composing `eslint-config-next`,
  its `core-web-vitals` and `typescript` presets.
- **TypeScript** (`tsconfig.json`): `strict: true`, `target: ES2022`,
  `moduleResolution: bundler`, `jsx: react-jsx`. Tests and `e2e/` are
  type-checked along with the app.

## Git hooks (Husky)

`.husky/pre-commit` runs `npx lint-staged` (Prettier on staged files) followed
by `npm run lint`. Since `lint:es` no longer auto-fixes, an ESLint error now
blocks the commit instead of being silently rewritten.

## GitHub Actions

`dev.yml` triggers on `push` **and** `pull_request`, with a concurrency group
that cancels superseded runs, and fans out to three reusable workflows:

- `_lint.yml` — `npm ci`, then `npm run lint`
- `_test.yml` — `npm ci`, then `npm run test:coverage`, uploading `coverage/`
- `_e2e.yml` — `npm ci`, `npm run build`, install Chromium, `npm run test:e2e`,
  uploading the Playwright report on failure

All three run on `ubuntu-latest` / Node 22 with npm caching, using
`actions/checkout@v5` and `actions/setup-node@v5`, and `npm ci` so the lockfile
is enforced.

`_e2e.yml` is also what verifies the production build — the build no longer
reaches `main` unchecked with only the Vercel preview standing behind it.

## Guardrails for AI agents

`.claude/` holds project-level agent configuration:

- **`settings.json` → PostToolUse hook** (`hooks/check-edited-file.sh`): after
  every `Edit`/`Write`, the touched file is Prettier-formatted, then linted,
  and `tsc` runs across the project. On failure the hook exits `2`, which
  feeds the error text straight back to the agent — a type error surfaces
  seconds after it is written rather than in CI.
- **`settings.json` → Stop hook** (`hooks/verify-before-stop.sh`): when an
  agent tries to finish with a dirty working tree, `npm run lint` and
  `npm run test` must pass first, otherwise stopping is blocked. It skips
  itself when the tree is clean and honours `stop_hook_active` so it cannot
  loop.
- **`skills/time-calculator-review/SKILL.md`**: a project-specific review
  checklist covering what the machine checks cannot — pipeline purity,
  errors-as-values, the negative-duration bug class, browser-only state, the
  `lib/` vs `features/` split, and test coverage.

The hooks are the hard, non-negotiable layer; the skill is the judgement layer.

## Dependabot

`.github/dependabot.yml`, npm, weekly, grouped by `next_react_major`,
`tailwind_major`, `eslint_major`, `sentry_major`, `eslint`, `minors` and
`patches`. This is the dominant source of commits.

## Deployment

Vercel, project `stefan-hausers-projects/time-calculator`, public at
`time-calculator.vercel.app`. Every PR gets a preview deployment.

## Sentry

Org `private-jv`, project `time-calc`. Four init points: browser
(`instrumentation-client.ts`), Node (`sentry.server.config.ts`), edge
(`sentry.edge.config.ts`) and `pages/_error.jsx`.

- The DSN is hardcoded in three files. A Sentry DSN is designed to be public,
  so this is not a secret leak, but dev and prod report into the same project.
- `tracesSampleRate: 1` and `profilesSampleRate: 1.0` — everything is sampled.
- Session replay only on error (`replaysSessionSampleRate: 0`).
- `next.config.js` enables `widenClientFileUpload`, `hideSourceMaps`,
  `disableLogger`, `automaticVercelMonitors` and `tunnelRoute: '/monitoring'`.
- `transpileClientSDK: true` (an IE11 option) is still set and is obsolete.

## Other agent tooling in the repo

- `.agents/skills/` — ten vendored Sentry skills pinned by `skills-lock.json`
  to `getsentry/sentry-for-ai` with content hashes. Do not hand-edit.
- `.junie/` — JetBrains Junie config, gitignored.
