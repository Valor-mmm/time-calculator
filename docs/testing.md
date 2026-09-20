# Testing

Three layers, all runnable locally and all gated in CI.

## Commands

```bash
npm run test           # Vitest, single run
npm run test:watch     # Vitest, watch mode
npm run test:coverage  # Vitest with a v8 coverage report in coverage/
npm run build && npm run test:e2e   # Playwright against the production build
npm run verify         # lint + test + build
```

## Layer 1 — unit tests on the domain pipeline

The whole calculation is pure functions, so these are plain input/output
tests with no mocking beyond a frozen clock.

- `parseTime.test.ts` — separator styles, blank lines, the open-ended entry,
  second/millisecond zeroing, and the bounds validation that rejects `24.00`
  and `12.60` instead of letting dayjs roll them over.
- `normalizeSequence.test.ts` — midnight crossing, the day offset carrying to
  later entries, multiple crossings, a shift resuming after midnight, both
  sides of the 12-hour plausibility limit, open-ended entries including one
  whose start is still in the future, and errors passing through.
- `timeDifference.test.ts` — the hour/minute split, second truncation, and
  errors passing through.
- `pauses.test.ts` — gap insertion, zero-length gaps, `TimeOrderError` for
  backwards entries, and no pause bridging an unparsable line.
- `aggregateTimeDifference.test.ts` — minute carry, repeated carry, error rows
  skipped.
- `configStore.test.ts` — defaults, corrupt JSON, wrong shapes, storage that
  throws.

Time-dependent tests pin the clock with `vi.setSystemTime(...)` so they do not
drift by time of day.

## Layer 2 — component tests

Testing Library with jsdom, querying by role, label and visible text — never by
class name, so Tailwind changes cannot break a test.

- `timeDiffTable.test.tsx` — entry, pause and both error rows; the pause
  filter; the two totals.
- `useLanguageSwitch.test.ts` — stored language, browser detection, fallbacks,
  sharing between consumers, and the regression test for the first-click bug
  (see below). The store holds module-level state, so each test re-imports the
  module through `vi.resetModules()`.
- `timeDifference.integration.test.tsx` — the whole pipeline end to end plus
  the real `TimeDifference` component: blur-to-render, clearing the input, and
  the pause toggle persisting across a remount.

## Layer 3 — end-to-end

Playwright (`e2e/`) drives Chromium against `next start` on a real production
build, which is also what verifies the build in CI.

Covered: summing a working day, the pause toggle surviving a reload, a night
shift, unparsable input, a backwards entry, and reaching both legal pages and
switching their language.

## Regression tests worth knowing about

These pin down bugs that were actually in the code:

1. **Negative durations across midnight** — `22.00 - 02.00` used to produce
   `-20h`. Pinned in `normalizeSequence.test.ts` and in the integration test's
   "durations must never go negative" block.
2. **Negative pauses from out-of-order entries** — now a `TimeOrderError` row.
3. **`99.99` accepted and silently rolled over** by dayjs — now a
   `TimeParsingError`.
4. **The language switch ignoring the first click** when the browser language
   was German: the store compared against its own stale default rather than the
   value it had handed to React. Found by the test suite while writing it.
   Playwright pins `locale: 'de-DE'` so the end-to-end spec exercises exactly
   this case; without the pin Chromium reports `en-GB`, which matches neither
   language and made the spec pass against the buggy code.
5. **A split night shift rejected as an ordering error** — `20.00 - 23.00`
   followed by `01.00 - 04.00` produced a red error row and lost the pause.
6. **An open-ended entry starting in the future inflating to nearly a day** —
   `20.00` entered at 15:30 read as 19h30m, and consumed a day offset that
   shifted every later entry.
7. **The bounds check bypassed by backtracking** — `123.45` matched as
   `23.45`, and `09.00 - 123.45` parsed as an open entry with the end time
   silently discarded.

## Conventions

- Unit and component tests live next to their source as `*.test.ts(x)`.
- End-to-end specs live in `e2e/` as `*.spec.ts`.
- A bug fix gets a test that fails without the fix.
- Assert on what a user can perceive (rendered text, roles, labels), not on
  internal structure.
