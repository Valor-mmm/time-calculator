# Domain Logic: time-difference

All files below live in `components/features/time-difference/`.

## Pipeline

```
parseTime → normalizeSequence → timeDifference → calculatePauses
                                                        ↓
                                            aggregateTimeDifference
```

Five pure functions, no React, no side effects. `calculateRows()` in
`index.tsx` is the single entry point that wires them together; it is exported
so the whole chain can be tested as one unit.

## Types (`types.ts`)

```ts
TimeInfo                  { hours: number; minutes: number }
ParsingResult             { from: Dayjs; to: Dayjs }
ParsingResultOrError      ParsingResult | TimeDifferenceError
TimeDifferenceInfo        ParsingResult & TimeInfo
TimeDifferenceInfoOrError TimeDifferenceInfo | TimeDifferenceError
Pause                     { between: { start, end }, pause: TimeInfo }
TimeDiffRow               TimeDifferenceInfoOrError | Pause
TimeDiffConfig            { showPauses: boolean }
```

`TimeDiffRow` is the single row union rendered by the table. Discrimination is
done by `instanceof TimeDifferenceError` first, then `isPause()`.

## Error model (`errors/`)

- `TimeDifferenceError extends Error` — the base, used as the union marker.
- `TimeParsingError` — carries `parsedString`, the offending input line, so the
  UI can echo it back.
- `TimeOrderError` — carries `previousEnd` and `currentStart`, raised when an
  entry starts implausibly far before the previous one ended.
- `FutureStartError` — carries `start`, raised for an open-ended entry whose
  start has not happened yet.

Errors are never thrown. They are returned as values and flow through the whole
pipeline, which is why every stage has an `instanceof` guard. Adding a failure
mode means adding a class here plus a branch in `determineErrorMessage`
(`timeDiffResult/timeDiffTable/timeDiffErrorRow.tsx`).

## `parseTime(timeInput: string): ParsingResultOrError[]`

Splits on `\n`, drops blank lines, and matches each line against:

```
/(\d{1,2})[:.,](\d{1,2})[.\s]*-?(?:[.\s]*(\d{1,2})[:.,](\d{1,2}))?/
```

- Separator between hour and minute: `:`, `.` or `,` — so `9:00`, `9.00` and
  `9,00` all parse. The dash is optional.
- The end time is **optional**. Given only a start time, `to` defaults to
  **now** and the entry is flagged `isOpenEnded`, so an open-ended
  "started at 09.00" line shows the elapsed time. The flag is what lets
  `normalizeSequence` tell that sentinel apart from a real end time.
- Both times are **bounds-checked**: hour `0–23`, minute `0–59`. Anything else
  becomes a `TimeParsingError` rather than being silently rolled over by dayjs.
- The pattern uses digit lookarounds, and a line containing a run of three or
  more digits next to a separator is rejected outright. Without both, the
  engine backtracks past a leading digit: `123.45` would match as `23.45`, and
  `09.00 - 123.45` would parse as an open entry with the end time silently
  discarded.
- `from` and `to` are built from **today's date** with seconds and milliseconds
  zeroed. Only the time of day matters; the app has no concept of dates beyond
  what `normalizeSequence` derives.

Non-matching lines yield a `TimeParsingError` holding the raw line.

## `normalizeSequence(entries): ParsingResultOrError[]`

Because every entry is parsed onto today's date, `22.00 - 02.00` would end
before it starts, and a shift that stops before midnight and resumes after it
would look like it ran backwards. This stage walks the entries in order,
keeping a running day offset and the previous entry's end:

- The offset is added to both ends of every entry.
- If an entry starts before the previous one ended, its day rolls forward —
  but only while the gap that implies stays within `MAX_IMPLIED_PAUSE_HOURS`
  (12). Beyond that it is far more likely a typo than a shift resuming after
  midnight, so the entry is left alone and `calculatePauses` reports it.
- If an entry still ends before it starts, its end moves one day forward (it
  crosses midnight) and the offset increments for everything that follows.
- An **open-ended** entry ends at the wall clock, which cannot be rolled. If
  the sequence has already moved past that instant, the entry cannot be
  running and becomes a `FutureStartError` — without consuming a day offset,
  so it does not shift the entries after it.
- Errors pass through and do **not** reset the offset: one junk line in the
  middle should not make every later entry jump a day.

What this does **not** do is reorder anything. The guarantee it provides is
that no entry ends before it starts, and that entries which are only
_apparently_ out of order because of midnight are put on the right day.
Genuinely out-of-order input is still caught downstream by `calculatePauses`.

The 12-hour limit is a heuristic, and it is the only place in the pipeline
where a number was picked rather than derived. `23.00 - 23.30` followed by
`00.30 - 01.00` rolls (a one-hour gap); `09.00 - 23.00` followed by
`11.01 - 12.00` does not (12h01) and is reported as an ordering error.

One deliberate trade-off remains: _within_ a single entry, an end before the
start always means crossing midnight, so `12.00 - 11.00` reads as a 23-hour
night shift rather than an error.

## `timeDifference` / `calculateTimeDiff` (`timeDifference.ts`)

`calculateTimeDiff(from, to)` takes the whole-minute difference and splits it
into `hours`/`minutes` by `% 60`; partial minutes are truncated, not rounded.
`timeDifference()` maps it over the entries, passing errors through.

## `calculatePauses` (`pauses.ts`)

Walks the entries in order and inserts a `Pause` row between each consecutive
pair, computed as `calculateTimeDiff(previous.to, current.from)`.

- An entry that `normalizeSequence` declined to roll forward — it starts
  before the previous one ended by more than the plausibility limit —
  produces a `TimeOrderError` row instead of a negative pause.
- An error row **resets** the running start, so no pause is computed across an
  unparsable line.
- `isPause(row)` is `!(row instanceof TimeDifferenceError) && 'pause' in row`.

## `aggregateTimeDifference` (`timeDiffResult/aggregateTimeDifference.ts`)

Reduces `TimeDiffRow[]` into a single `TimeInfo`, skipping errors and reading
`pause.hours/minutes` for pause rows. Minutes carry into hours once per step,
which is sufficient because both operands are below 60.

`TimeDiffResult` calls it twice on pre-filtered lists — once for worked time
(pauses excluded), once for pause time — so the two totals never mix.

## Config persistence (`timeDiffResult/configStore.ts`)

`{ showPauses: boolean }` under the `localStorage` key `TIME_DIFF_CONFIG`.
Reads are SSR-guarded, wrapped in `try`/`catch`, and shape-validated before
use; anything unexpected falls back to `{ showPauses: false }`. Writes are
best-effort and swallow quota or permission errors.

## Remaining behaviours to be aware of

Not bugs, but worth knowing — all covered by tests:

1. **A reversed entry reads as a night shift.** `12.00 - 11.00` is 23 hours.
   See the trade-off in `normalizeSequence` above.
2. **Open-ended entries are frozen at blur time.** `to = now` is captured once;
   the row does not tick forward afterwards.
3. **Surrounding text is ignored.** The pattern is unanchored, so
   `Mo 09.00 - 12.30 lunch` parses fine. Digit runs touching a separator are
   the exception and reject the line outright.
4. **Rows are keyed by array index.** Safe while the list is fully recomputed
   on every blur.
5. **Two separate days entered as consecutive lines** exceed the 12-hour limit
   and are reported as an ordering error. The app models one day of times.
