import { calculateTimeDiff } from './timeDifference'
import {
  Pause,
  TimeDifferenceInfo,
  TimeDifferenceInfoOrError,
  TimeDiffRow,
} from './types'
import { TimeDifferenceError } from './errors'
import { TimeOrderError } from './errors/TimeOrderError'

export const isPause = (input: TimeDiffRow): input is Pause =>
  !(input instanceof TimeDifferenceError) && 'pause' in input

/**
 * Interleaves the gap between two consecutive entries as a `Pause` row.
 *
 * An entry that starts before the previous one ended would produce a negative
 * pause, so it is surfaced as a `TimeOrderError` row instead of quietly
 * subtracting from the total.
 */
export const calculatePauses = (
  timeDiffOrError: TimeDifferenceInfoOrError[],
): TimeDiffRow[] => {
  const timeDiffRows: TimeDiffRow[] = []
  let start: TimeDifferenceInfo | undefined

  for (const tdOe of timeDiffOrError) {
    if (tdOe instanceof TimeDifferenceError) {
      timeDiffRows.push(tdOe)
      start = undefined
      continue
    }

    if (!start) {
      start = tdOe
      timeDiffRows.push(tdOe)
      continue
    }

    if (tdOe.from.isBefore(start.to)) {
      timeDiffRows.push(
        new TimeOrderError(start.to.format('HH.mm'), tdOe.from.format('HH.mm')),
      )
    } else {
      timeDiffRows.push({
        between: { start, end: tdOe },
        pause: calculateTimeDiff(start.to, tdOe.from),
      })
    }

    timeDiffRows.push(tdOe)
    start = tdOe
  }

  return timeDiffRows
}
