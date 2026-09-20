# Domain Logic: time-difference

All files below live in `components/features/time-difference/`.

## What the input actually is

Not a time format — **pasted notes**. One page of notes per day, except that
Friday, Saturday and Sunday share a page, with a header line such as
`Samstag:` introducing each extra day. Alongside the times there is the
occasional prose note ("auf Mittwoch gebucht"). Everything on the page arrives
in one paste, so the pipeline has to cope with all of it.

That shapes every rule below: multi-day input is the normal case, prose is not
an error, and a work day ends where the notes say it does.

## Pipeline

```
parseTime → normalizeSequence → timeDifference → calculatePauses
                                                        ↓
                                     groupByDay + aggregateTimeDifference
                                                 + aggregatePauses
```

Pure functions, no React, no side effects. `calculateRows()` in `index.tsx` is
the single entry point that wires the first four together; it is exported so
the whole chain can be tested as one unit. `groupByDay` and the aggregations
run in `TimeDiffResult` because they exist only for display.

## Types (`types.ts`)

```ts
TimeInfo                  { hours: number; minutes: number }
ParsingResult             { from: Dayjs; to: Dayjs; isOpenEnded?: boolean }
DayHeader                 { label: string }          — `Samstag:`
NoteLine                  { note: string }           — prose kept for context
ParsedLine                ParsingResult | DayHeader | NoteLine | Error
DayGroup                  { label?, rows, total, pauseTotal }
ParsingResultOrError      ParsingResult | TimeDifferenceError
TimeDifferenceInfo        ParsingResult & TimeInfo
TimeDifferenceInfoOrError TimeDifferenceInfo | TimeDifferenceError
Pause                     { between: { start, end }, pause: TimeInfo }
TimeDiffRow               TimeDifferenceInfoOrError | Pause | DayHeader | NoteLine
TimeDiffConfig            { showPauses: boolean }
```

`TimeDiffRow` is the single row union rendered by the table. Discrimination is
done by `instanceof TimeDifferenceError` first, then `isPause()`.

## Error model (`errors/`)

- `TimeDifferenceError extends Error` — the base, used as the union marker.
- `TimeParsingError` — carries `parsedString`, the offending input line, so the
  UI can echo it back.
- `FutureStartError` — carries `start`, raised for an open-ended entry whose
  start has not happened yet.

Errors are never thrown. They are returned as values and flow through the whole
pipeline, which is why every stage has an `instanceof` guard. Adding a failure
mode means adding a class here plus a branch in `determineErrorMessage`
(`timeDiffResult/timeDiffTable/timeDiffErrorRow.tsx`).

## `parseTime(timeInput: string): ParsingResultOrError[]`

Produces one `ParsedLine` per non-blank line, in this order of precedence:

1. A line ending in `:` is a **day header**, label without the colon.
2. A line whose digits cannot be a time is a `TimeParsingError`.
3. A line matching the time pattern is an **entry**.
4. A line still containing a digit is a `TimeParsingError` — it was probably
   meant to be a time.
5. Anything else is a **note**.

Rule 4 is why prose is safe: `auf Mittwoch gebucht` has no digits and becomes a
note, while `1x.00 - 12.00` does and becomes an error.

Entries are matched against:

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

## `normalizeSequence(lines): ParsedLine[]`

Because every entry is parsed onto today's date, `22.00 - 02.00` would end
before it starts, and any second day on the page would look like it ran
backwards. This stage walks the lines in order, keeping a running day offset
and the previous entry's end:

- The offset is added to both ends of every entry.
- If an entry starts before the previous one ended, its day rolls forward.
- If an entry still ends before it starts, its end moves one day forward and
  the offset increments for everything that follows.
- An **open-ended** entry ends at the wall clock, which cannot be rolled. If
  the sequence has already moved past that instant, the entry cannot be
  running and becomes a `FutureStartError` — without consuming a day offset,
  so it does not shift the entries after it.
- Headers, notes and errors pass through and do **not** reset the offset.

Rolling is **silent**. An earlier version warned when a time went backwards by
more than twelve hours, on the theory that it was a typo. That was wrong for
how the app is used: an ordinary pasted work week produced four red rows, and
a Friday-to-Sunday page produced one for every weekend day. No threshold below
twenty-four hours works, because the next work day can start at any time — and
since rolling is capped at one day anyway, "cap at 24h" just means "always
roll".

The cost is that an outright typo, `09.00 - 12.00` followed by `08.00 - 10.00`,
now reads as the next day rather than a warning. The notes are the source of
truth for where a work day ends, and they say so with a header.

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

- A **day header ends the run**: the gap from knocking off to starting the next
  work day is not a break, and counting it would make the pause total
  meaningless on a page covering several days.
- A gap that merely crosses midnight **is** a pause — that is a night shift,
  not a new work day. This is the one place where the calendar day and the
  work day deliberately disagree.
- An error row also resets the running start; nothing can be said about a gap
  measured against a line that could not be read.
- A note does **not** break the run.
- `isPause(row)` is `!(row instanceof TimeDifferenceError) && 'pause' in row`.

## `groupByDay` and the aggregations (`timeDiffResult/`)

`aggregateTimeDifference` sums entry rows; `aggregatePauses` sums pause rows.
Both skip headers, notes and errors. Minutes carry into hours once per step,
which is sufficient because both operands are below 60.

`groupByDay` splits the rows at every day header into `DayGroup`s, each with
its own totals. Notes from a single day carry no header at all and yield
exactly one unlabelled group, which the table renders without any day
scaffolding — so the everyday case looks as it always did, and a subtotal only
appears when there is more than one day to compare.

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
5. **Days without a header are one work day.** Several days pasted with no
   header lines still total correctly, but the gaps between them are counted
   as breaks, so the pause total inflates. A header fixes it.
6. **A note sits where it was written**, which can place it before the pause
   row that follows the entry above it.
