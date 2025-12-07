import { calculateTimeDiff } from './timeDifference'
import {
  Pause,
  TimeDifferenceInfo,
  TimeDifferenceInfoOrError,
  TimeDiffRow,
} from './types'
import { TimeDifferenceError } from './errors'

export const isPause = (input: TimeDiffRow): input is Pause =>
  input.hasOwnProperty('pause')

export const calculatePauses = (
  timeDiffOrError: TimeDifferenceInfoOrError[],
): TimeDiffRow[] => {
  const timeDiffRows: TimeDiffRow[] = []
  let start: TimeDifferenceInfo

  for (const tdOe of timeDiffOrError) {
    if (!start && !(tdOe instanceof TimeDifferenceError)) {
      start = tdOe
      timeDiffRows.push(tdOe)
    } else if (!(tdOe instanceof TimeDifferenceError)) {
      timeDiffRows.push({
        between: { start, end: tdOe },
        pause: calculateTimeDiff(start.to, tdOe.from),
      })
      timeDiffRows.push(tdOe)
      start = tdOe
    } else {
      timeDiffRows.push(tdOe)
      start = undefined
    }
  }

  return timeDiffRows
}
