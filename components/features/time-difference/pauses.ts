import { calculateTimeDiff } from './timeDifference'
import {
  isDayHeader,
  isNoteLine,
  Pause,
  TimeDifferenceInfo,
  TimeDiffRow,
} from './types'
import { TimeDifferenceError } from './errors'

export const isPause = (input: TimeDiffRow): input is Pause =>
  !(input instanceof TimeDifferenceError) && 'pause' in input

/**
 * Interleaves the gap between two consecutive entries as a `Pause` row.
 *
 * A day header ends the run: the gap from knocking off to starting the next
 * work day is not a break, and counting it would make the pause total
 * meaningless on notes covering several days. A gap that merely crosses
 * midnight is still a pause — that is a night shift, not a new work day.
 *
 * An error also ends the run, since nothing can be said about a gap measured
 * against a line that could not be read.
 */
export const calculatePauses = (rows: TimeDiffRow[]): TimeDiffRow[] => {
  const withPauses: TimeDiffRow[] = []
  let start: TimeDifferenceInfo | undefined

  for (const row of rows) {
    if (isNoteLine(row)) {
      withPauses.push(row)
      continue
    }

    if (row instanceof TimeDifferenceError || isDayHeader(row)) {
      withPauses.push(row)
      start = undefined
      continue
    }

    if (isPause(row)) {
      withPauses.push(row)
      continue
    }

    if (start) {
      withPauses.push({
        between: { start, end: row },
        pause: calculateTimeDiff(start.to, row.from),
      })
    }

    withPauses.push(row)
    start = row
  }

  return withPauses
}
