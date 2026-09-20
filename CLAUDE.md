# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`time-calculator` — a client-side Next.js app that converts pasted lines of
time ranges (`09.00 - 12.30`) into per-line durations, gap ("pause") rows and a
total. No backend, no database, no API routes. Deployed on Vercel at
`time-calculator.vercel.app`.

Deeper documentation lives in [`docs/`](./docs/README.md):

- [`docs/architecture.md`](./docs/architecture.md) — layout, data flow, state
- [`docs/domain-logic.md`](./docs/domain-logic.md) — the calculation pipeline and its semantics
- [`docs/testing.md`](./docs/testing.md) — the three test layers and conventions
- [`docs/tooling-and-ci.md`](./docs/tooling-and-ci.md) — scripts, CI, guardrails, Sentry
- [`docs/state-of-the-repo.md`](./docs/state-of-the-repo.md) — open PRs and open items

Keep these updated when you change what they describe.

## Stack

Next.js 16 **Pages Router** (`pages/`, not `app/`) · React 19 · TypeScript 5.9
in **strict** mode · Tailwind CSS 4 · dayjs · Sentry · Vercel.

## Commands

```
npm run dev      # dev server
npm run lint     # prettier --check && eslint && tsc   <- the gate, non-mutating
npm run fix      # apply prettier + eslint fixes
npm run test     # vitest (unit + component)
npm run test:e2e # playwright — run `npm run build` first
npm run verify   # lint + test + build
npm run build    # production build
```

**Run `npm run lint` and `npm run test` before finishing any change.** These
are exactly what CI and the Husky pre-commit hook run. A Stop hook enforces it
when the working tree is dirty, and a PostToolUse hook formats and type-checks
each file as you write it — but do not rely on the hooks to think for you.

For a review pass, use the `time-calculator-review` skill in
`.claude/skills/` — it covers the project-specific traps the linters cannot see.

## Conventions

- **Prettier is authoritative**: no semicolons, single quotes. Never
  hand-format against it; run `npm run fix`.
- **`components/lib/` vs `components/features/`** — `lib/` is for reusable,
  domain-free UI primitives; everything domain-specific goes in
  `features/<feature>/`. Keep that split.
- **Folder-per-component** with `index.tsx` as the public entry; nested folders
  mirror the component tree.
- **Errors are values, not throws.** The pipeline returns
  `TimeDifferenceError` subclasses inline in its result arrays and every stage
  guards with `instanceof`. A new failure mode needs a class under `errors/`, a
  branch in `determineErrorMessage`, and a test for the rendered message.
  `try`/`catch` is reserved for hostile browser APIs (`localStorage`,
  `navigator`).
- **Keep the domain logic pure.** `parseTime → normalizeSequence →
timeDifference → calculatePauses → aggregateTimeDifference` are plain
  functions with no React dependency, wired by the exported `calculateRows()`.
  New logic belongs there, not in a component.
- **Tests live next to their source** as `*.test.ts(x)`; end-to-end specs go in
  `e2e/` as `*.spec.ts`. A bug fix gets a test that fails without it. Assert on
  rendered text, roles and labels — never on class names.
- Components are typed as `FC<Props>` or with an inline destructured props
  interface; both exist, match the neighbouring file.
- UI text is English; the legal pages are dual-language (de-DE / en-EN) via
  `useLanguageSwitch`.

## Things to know before changing code

- **Negative durations are the bug class this project has actually shipped.**
  `normalizeSequence` guarantees the entry sequence is chronological and
  `calculatePauses` turns a backwards entry into a `TimeOrderError`. If you
  touch either, re-check midnight, out-of-order input, open-ended entries and
  the `0`/`23`/`59` boundaries. No negative number may reach
  `aggregateTimeDifference`.
- A reversed entry such as `12.00 - 11.00` reads as a 23-hour night shift. That
  is a deliberate trade-off, not an oversight — see `docs/domain-logic.md`.
- `useLanguageSwitch` is a hand-rolled `useSyncExternalStore`. Its
  `getSnapshot` is the single source of truth; a second place deciding the
  current language reintroduces a real bug where the first click on the switch
  did nothing. The `'en-EN'` server snapshot prevents a hydration mismatch —
  do not remove it.
- Any `window` / `localStorage` / `navigator` access must survive being absent,
  throwing, and returning garbage. `configStore.ts` shows the pattern.
- `.agents/skills/` is vendored third-party content pinned by
  `skills-lock.json`. Do not hand-edit it; it is excluded from Prettier on
  purpose.
- The Sentry DSN is intentionally public and hardcoded in
  `instrumentation-client.ts`, `sentry.server.config.ts` and
  `sentry.edge.config.ts`.

## Git

- `main` is the default branch; branch before committing.
- Recent history is dominated by Dependabot. Keep human commits scoped and
  conventional (`Feat(...)`, `Fix(...)`, `Chore(...)`).
- Do not merge or close pull requests without being asked — that is the
  maintainer's call.
