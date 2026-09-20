---
name: time-calculator-review
description: Project-specific review checklist for time-calculator. Use before finishing any change to components/features/time-difference, the language switch, or the time-parsing pipeline — and whenever the user asks for a review of work in this repo.
---

# time-calculator review checklist

`npm run lint` and `npm run test` cover what a machine can check. This covers
what it cannot: whether the change fits how this codebase actually works.

Walk the sections that apply to the diff. For each finding, name the file and
line, say what breaks concretely, and either fix it or report it — do not note
it in passing and move on.

## 1. Did the domain pipeline stay pure?

The chain is `parseTime → normalizeSequence → timeDifference → calculatePauses
→ aggregateTimeDifference`. Every stage is a plain function with no React
import, no `window` access and no side effects.

- New logic belongs in this chain, not in a component or a hook.
- A stage that suddenly needs `useState`, `localStorage` or `Date.now()` in the
  middle of a calculation is a design smell — pass the value in instead.
- `parseTime` is the only place allowed to read the current time, and it does
  so once per call.

## 2. Are errors still values?

Nothing in the pipeline throws. Unusable input becomes a `TimeDifferenceError`
subclass that travels in the result array and gets rendered as a row.

- A new failure case needs a class under `errors/`, a branch in
  `determineErrorMessage` (`timeDiffErrorRow.tsx`), and a test asserting the
  rendered message.
- A new `try`/`catch` inside the pipeline is almost always wrong. `try`/`catch`
  is only for hostile browser APIs (`localStorage`, `navigator`).
- Every stage that maps over rows must pass errors through untouched. Check
  the new code has an `instanceof TimeDifferenceError` guard.

## 3. Can this produce a negative or nonsense duration?

This is the bug class this project has actually shipped. Re-derive it for the
change at hand:

- What happens at exactly midnight, and to a range that crosses it
  (`22.00 - 02.00`)?
- What happens when entries are out of chronological order?
- What happens with an open-ended entry (`09.00` with no end time)?
- What happens to hour `0`, hour `23`, minute `0`, minute `59`, and to
  out-of-range values like `24.00` or `12.60`?

`normalizeSequence` guarantees the sequence is chronological and
`calculatePauses` turns a backwards entry into a `TimeOrderError`. If the
change touches either, confirm both guarantees still hold — a negative number
must never reach `aggregateTimeDifference`.

## 4. Is the browser-only state still safe?

- Any `window`, `localStorage` or `navigator` read must survive being absent,
  throwing, and returning garbage. Both `configStore.ts` and
  `useLanguageSwitch.ts` show the pattern: guard, `try`/`catch`, validate the
  shape, fall back to a default.
- `useLanguageSwitch` returns `'en-EN'` as its server snapshot on purpose. Do
  not remove it — it is what prevents a hydration mismatch.
- The language store's `getSnapshot` is the single source of truth. A second
  place that decides the current language reintroduces the drift bug that made
  the first click on the switch a no-op.

## 5. Does the structure still hold?

- `components/lib/` is domain-free and reusable; `components/features/<x>/` is
  domain code. A time concept leaking into `lib/` is wrong.
- Folder-per-component, `index.tsx` as the public entry, nested folders mirror
  the component tree.
- Prettier is authoritative: no semicolons, single quotes. Never hand-format.

## 6. Is it actually covered?

- Every behaviour change needs a test that fails without it. For a bug fix,
  write the failing test first and say so.
- Pure logic goes in a `*.test.ts` next to the source. UI behaviour goes in a
  `*.test.tsx` with Testing Library, queried by role or label, never by class.
- A user-visible flow worth protecting goes in `e2e/`.
- Run `npm run test` and, if the change touches rendering or routing,
  `npm run build && npm run test:e2e`.

## 7. Finally

Report what you checked and what you found. If a section did not apply to this
diff, say so rather than implying you verified it.
