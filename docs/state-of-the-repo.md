# State of the Repository

Baseline taken 2026-09-20 at `main` = `660ebe1`, then reworked on the
`chore/quality-foundation` branch. Before that, recent history was almost
entirely Dependabot merges.

## Open pull requests (unchanged — none of these were touched)

All five are Dependabot; merging or closing them is a manual call.

- **#171** — minors group, 7 updates (Sentry 10.53→10.69, Next 16.2.6→16.3.0,
  typescript-eslint 8.59→8.66, Prettier 3.8.3→**3.9.6**). `lint` failed only
  because Prettier 3.9.6 reformats four files, two of which are vendored
  Sentry skill docs under `.agents/`. **Adding `.agents/` to `.prettierignore`
  on this branch removes half that cause**; the remaining two source files are
  already reformatted here.
- **#166** — eslint 9.39.2 → **10.4.0** (major), red. A real migration:
  needs `eslint-config-next` to support ESLint 10.
- **#165** — lint-staged 16.4.0 → 17.0.5. **Green and mergeable.**
- **#155** — typescript 5.9.3 → **6.0.3** (major), red. Worth retrying now
  that the code type-checks under `strict`.
- **#148** — eslint 9.39.2 → 10.1.0. **Superseded by #166 and conflicting.**
  Should be closed.

Suggested order: close #148, then #165 → #171 → #155 → #166.

## What changed on this branch

**Tests — from zero to three layers.** Vitest + Testing Library for unit and
component tests, Playwright for end-to-end against a real production build.
See [testing.md](./testing.md).

**Correctness fixes**, each pinned by a regression test:

1. Ranges crossing midnight no longer produce negative durations — a new
   `normalizeSequence` stage rolls the calendar day forward and carries the
   offset to later entries.
2. Out-of-order entries no longer produce a negative pause. This first became
   a warning row and was then replaced entirely — see the third round below.
3. `parseTime` bounds-checks hours and minutes, so `24.00` and `12.60` become
   parse errors instead of being rolled over by dayjs.
4. `configStore` no longer throws on corrupt `localStorage`; it validates the
   shape and falls back to the default.
5. The dead branch in `handleBlur` is gone; the pipeline moved into an exported
   `calculateRows()` that can be tested directly.
6. **Found while writing the tests:** the language switch ignored the first
   click for anyone whose browser language was German. The store compared
   against its own stale `'en-EN'` default rather than the value it had handed
   to React, so `setLanguage('en-EN')` returned early and nothing happened. The
   store's `getSnapshot` is now the single source of truth.

**A second round after an independent review.** A fresh agent reviewed the
branch cold and found that three of the four claimed fixes were narrower than
their commit messages said: a split night shift was still rejected as an
ordering error, an open-ended entry starting in the future inflated to nearly
a full day, and the new bounds check was bypassed by regex backtracking. It
also found that the end-to-end language spec passed against the buggy code
(Chromium reports `en-GB`, matching neither language), that the Stop hook went
inert as soon as an agent committed, and that four documents asserted an
invariant `normalizeSequence` does not provide. All fixed, each with a
regression test; the locale is now pinned and the hook compares against the
merge base.

**A third round after the real workflow came to light.** The app had been
built and documented as "one day of times". It is actually used by pasting a
whole notes page: one page per day, except Friday, Saturday and Sunday which
share a page with `Samstag:` style headers, plus the odd prose line. Under the
old model an ordinary pasted work week produced four red error rows and a
weekend page flagged every extra day.

- Day headers are recognised, split the rows into work days with their own
  subtotals, and stop a pause being counted across them.
- Prose lines are kept as notes instead of being reported as errors; only a
  line whose digits cannot be a time still is.
- The out-of-order warning is gone. No threshold below twenty-four hours works
  (the next work day can start at any time) and rolling is capped at a day
  anyway, so "always roll" is the only coherent rule. A gap that merely
  crosses midnight stays a pause, because a night shift is one work day.
- Lines holding something time-shaped that was not understood — `1x.00 -
12.00`, or two ranges crammed onto one line — are now rejected rather than
  half-read, which was silently changing the total.
- Open-ended entries render as `09.00 - now`.

**TypeScript** — `strict: true`, `target: ES2022`, `moduleResolution: bundler`.
The codebase type-checks clean; `pauses.ts`, which depended on the loose
settings, was rewritten.

**CI** — `pull_request` trigger, concurrency cancellation, `npm ci`, Node 22
with npm caching, `checkout@v5`/`setup-node@v5`, and separate lint, test and
build+e2e jobs. `next build` now runs in CI instead of only on Vercel.
`npm run lint` no longer auto-fixes, so local and CI results agree.

**Agent guardrails** — `.claude/settings.json` with a PostToolUse hook
(format + lint + `tsc` on every edit, errors fed back to the agent) and a Stop
hook (`npm run lint` and `npm run test` must pass before an agent may finish),
plus a project review skill under `.claude/skills/time-calculator-review/`.

**Documentation** — this `docs/` folder, a `CLAUDE.md`, and a real `README.md`
replacing the untouched Next.js example boilerplate. `package.json` is now
named `time-calculator` rather than `with-tailwindcss`.

## What is still open

- **No license** on a public repository, and no repository description.
- **No CODEOWNERS, PR template or issue templates.**
- **Branch protection** is not configured; the new CI checks are not required
  for merge. Worth enabling now that they are meaningful.
- **Sentry DSN is hardcoded** in three files rather than read from an env var,
  so dev and prod report into the same project.
- **`transpileClientSDK: true`** (IE11) in `next.config.js` is obsolete.
- **`eslint-config-prettier`** is a dependency but is not used in
  `eslint.config.mjs`.
- **Coverage is reported but not enforced.** No threshold is set.
- A reversed entry such as `12.00 - 11.00` reads as a 23-hour night shift
  rather than an error — a deliberate trade-off, documented in
  [domain-logic.md](./domain-logic.md).
- Automatic typo detection is gone with the out-of-order warning. Several days
  pasted **without** header lines still total correctly, but their gaps count
  as breaks and inflate the pause total.
- Two requested features are not built: a configurable daily target with the
  time still to work, and the correction mode in
  [planned-correction-mode.md](./planned-correction-mode.md).
- The PostToolUse hook type-checks the whole project rather than the edited
  file, so mid-refactor it reports errors in files the agent has not reached
  yet, and a file outside the tsconfig `include` goes unchecked.
- `noUncheckedIndexedAccess` is off — it is not part of `strict`, so indexed
  access is still typed as if always present.

## What was already healthy

- Clean, consistent structure: `lib/` vs `features/`, folder-per-component.
- Business logic genuinely pure and decoupled from React — it was testable
  as-is, with no refactor needed first.
- Errors-as-values applied consistently end to end.
- Dependencies exact-pinned and kept current by a well-grouped Dependabot.
- Observability wired across all four runtimes via Sentry.
