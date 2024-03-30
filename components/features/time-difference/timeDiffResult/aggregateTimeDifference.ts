import { TimeDifferenceError } from '../errors'
import { TimeDiffRow, TimeInfo } from '../types'
import { isPause } from '../pauses'

export const aggregateTimeDifference = (
  timeDifferences: TimeDiffRow[],
): TimeInfo =>
  timeDifferences.reduce(
    (agg, current) => {
      if (current instanceof TimeDifferenceError) {
        return agg
      }

      let hourSum: number
      let minuteSum: number

      if (isPause(current)) {
        hourSum = agg.hours + current.pause.hours
        minuteSum = agg.minutes + current.pause.minutes
      } else {
        hourSum = agg.hours + current.hours
        minuteSum = agg.minutes + current.minutes
      }
      return {
        hours: hourSum + (minuteSum >= 60 ? 1 : 0),
        minutes: minuteSum - (minuteSum >= 60 ? 60 : 0),
      }
    },
    {
      minutes: 0,
      hours: 0,
    } as TimeInfo,
  )
