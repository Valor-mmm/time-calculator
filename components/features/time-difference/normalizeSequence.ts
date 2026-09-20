import { ParsingResult, ParsingResultOrError } from './parseTime'
import { TimeDifferenceError } from './errors'
import { FutureStartError } from './errors/FutureStartError'

/**
 * Rolling an entry forward is only plausible while the gap it implies stays
 * within a working day's rest period. Beyond that, an entry that starts
 * before the previous one ended is far more likely a typo than a shift
 * resuming after midnight, so it is left alone for `calculatePauses` to
 * report as a `TimeOrderError`.
 */
const MAX_IMPLIED_PAUSE_HOURS = 12

/**
 * Entries are parsed as times of day on today's date, so a night shift would
 * end before it starts and a shift resuming after midnight would look like it
 * ran backwards.
 *
 * This walks the entries in order and rolls the calendar day forward in two
 * situations: when an entry ends before it starts (it crosses midnight), and
 * when an entry starts before the previous one ended by a plausible margin (a
 * shift resuming after midnight). The offset carries to every following
 * entry, so neither durations nor the pauses between entries come out
 * negative.
 *
 * An open-ended entry ends "now", which is a fixed instant and must not be
 * rolled; if the sequence has moved past it, the entry cannot be running and
 * becomes a `FutureStartError`.
 *
 * Unparsable entries pass through untouched. They do not reset the offset —
 * a junk line in the middle should not make every later entry jump a day.
 */
export const normalizeSequence = (
  entries: ParsingResultOrError[],
): ParsingResultOrError[] => {
  let dayOffset = 0
  let previousEnd: ParsingResult['to'] | undefined

  return entries.map((entry) => {
    if (entry instanceof TimeDifferenceError) {
      return entry
    }

    let from = entry.from.add(dayOffset, 'day')

    if (previousEnd && from.isBefore(previousEnd)) {
      const rolled = from.add(1, 'day')
      if (rolled.diff(previousEnd, 'hour', true) <= MAX_IMPLIED_PAUSE_HOURS) {
        from = rolled
        dayOffset += 1
      }
    }

    if (entry.isOpenEnded) {
      // `to` is the wall clock, so it cannot move with the offset.
      if (entry.to.isBefore(from)) {
        return new FutureStartError(entry.from.format('HH.mm'))
      }

      previousEnd = entry.to
      return { from, to: entry.to }
    }

    let to = entry.to.add(dayOffset, 'day')

    if (to.isBefore(from)) {
      to = to.add(1, 'day')
      dayOffset += 1
    }

    previousEnd = to
    return { from, to }
  })
}
