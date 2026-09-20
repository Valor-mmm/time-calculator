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
  entry starts before the previous one ended.

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
  **now**, so an open-ended "started at 09.00" line shows the elapsed time.
- Both times are **bounds-checked**: hour `0–23`, minute `0–59`. Anything else
  becomes a `TimeParsingError` rather than being silently rolled over by dayjs.
- `from` and `to` are built from **today's date** with seconds and milliseconds
  zeroed. Only the time of day matters; the app has no concept of dates beyond
  what `normalizeSequence` derives.

Non-matching lines yield a `TimeParsingError` holding the raw line.

## `normalizeSequence(entries): ParsingResultOrError[]`

Because every entry is parsed onto today's date, `22.00 - 02.00` would end
before it starts. This stage walks the entries in order and keeps a day offset:

- The offset is added to both ends of every entry.
- If an entry still ends before it starts, its end moves one day forward (a
  night shift) and the offset increments for everything that follows.
- Errors pass through and do **not** reset the offset.

The result is a chronological sequence, which is what makes negative durations
structurally impossible. `22.00 - 02.00` followed by `03.00 - 05.00` becomes
`day 0 22:00 → day 1 02:00` then `day 1 03:00 → day 1 05:00`, so the pause
between them is a clean hour.

The deliberate trade-off: a typo like `12.00 - 11.00` reads as a 23-hour night
shift rather than an error. Within one entry, end-before-start is treated as
crossing midnight; only _between_ entries is going backwards treated as a
mistake.

## `timeDifference` / `calculateTimeDiff` (`timeDifference.ts`)

`calculateTimeDiff(from, to)` takes the whole-minute difference and splits it
into `hours`/`minutes` by `% 60`; partial minutes are truncated, not rounded.
`timeDifference()` maps it over the entries, passing errors through.

## `calculatePauses` (`pauses.ts`)

Walks the entries in order and inserts a `Pause` row between each consecutive
pair, computed as `calculateTimeDiff(previous.to, current.from)`.

- An entry starting before the previous one ended produces a `TimeOrderError`
  row instead of a negative pause.
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
3. **Junk after a valid match is ignored.** The regex is unanchored, so
   `09.00 - 12.30 lunch` parses fine.
4. **Rows are keyed by array index.** Safe while the list is fully recomputed
   on every blur.
