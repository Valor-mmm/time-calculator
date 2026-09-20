import { ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'
import { FutureStartError } from './errors/FutureStartError'
import { isDayHeader, isNoteLine, ParsedLine } from './types'

/**
 * Entries are parsed as times of day on today's date, so a night shift would
 * end before it starts and a shift resuming after midnight would look like it
 * ran backwards.
 *
 * This walks the lines in order and rolls the calendar day forward whenever an
 * entry would otherwise run backwards — either within itself (it crosses
 * midnight) or against the entry before it (the clock has passed midnight).
 * The offset carries to everything that follows, so neither durations nor the
 * gaps between entries can come out negative.
 *
 * Rolling is silent on purpose. The pasted notes are the source of truth for
 * where a work day ends, and they say so with a header line; a time that
 * merely goes backwards is far more likely the clock passing midnight than a
 * mistake, and warning about it was noise on ordinary input.
 *
 * An open-ended entry ends "now", which is a fixed instant and must not be
 * rolled. If the sequence has moved past it, the entry cannot be running and
 * becomes a `FutureStartError`.
 *
 * Headers, notes and errors pass through untouched and do not reset the
 * offset — a junk line in the middle should not make later entries jump a day.
 */
export const normalizeSequence = (lines: ParsedLine[]): ParsedLine[] => {
  let dayOffset = 0
  let previousEnd: ParsingResult['to'] | undefined

  return lines.map((line) => {
    if (
      line instanceof TimeDifferenceError ||
      isDayHeader(line) ||
      isNoteLine(line)
    ) {
      return line
    }

    let from = line.from.add(dayOffset, 'day')

    if (previousEnd && from.isBefore(previousEnd)) {
      from = from.add(1, 'day')
      dayOffset += 1
    }

    if (line.isOpenEnded) {
      // `to` is the wall clock, so it cannot move with the offset.
      if (line.to.isBefore(from)) {
        return new FutureStartError(line.from.format('HH.mm'))
      }

      previousEnd = line.to
      return { from, to: line.to, isOpenEnded: true }
    }

    let to = line.to.add(dayOffset, 'day')

    if (to.isBefore(from)) {
      to = to.add(1, 'day')
      dayOffset += 1
    }

    previousEnd = to
    return { from, to }
  })
}
