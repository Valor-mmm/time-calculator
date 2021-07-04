import { TimeDifferenceInfo } from '../useTimeDiffCalculator'
import { TimeInfo } from '../index'

export const useTimeDiffAggregation = (
  timeDifferences: TimeDifferenceInfo[]
): TimeInfo =>
  timeDifferences.reduce(
    (agg, current) => {
      const hourSum = agg.hours + current.hours
      const minuteSum = agg.minutes + current.minutes
      return {
        hours: hourSum + (minuteSum >= 60 ? 1 : 0),
        minutes: minuteSum - (minuteSum >= 60 ? 60 : 0),
      }
    },
    {
      minutes: 0,
      hours: 0,
    } as TimeInfo
  )
