import { ParsingResult, ParsingResultOrError } from './parseTime'
import { TimeDifferenceError } from './errors'

/**
 * Entries are parsed as times of day on today's date, so an entry that ends
 * before it starts (`22.00 - 02.00`) would yield a negative duration.
 *
 * This walks the entries in order and rolls the calendar day forward whenever
 * an entry crosses midnight. The offset is carried to every following entry,
 * so the whole sequence stays chronological and neither durations nor the
 * pauses between entries can come out negative.
 *
 * Unparsable entries pass through untouched and do not reset the offset.
 */
export const normalizeSequence = (
  entries: ParsingResultOrError[],
): ParsingResultOrError[] => {
  let dayOffset = 0

  return entries.map((entry) => {
    if (entry instanceof TimeDifferenceError) {
      return entry
    }

    const from = entry.from.add(dayOffset, 'day')
    let to = entry.to.add(dayOffset, 'day')

    if (to.isBefore(from)) {
      to = to.add(1, 'day')
      dayOffset += 1
    }

    return { from, to } as ParsingResult
  })
}
