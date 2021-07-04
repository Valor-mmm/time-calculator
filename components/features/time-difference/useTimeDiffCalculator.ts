import { ParsingResult } from './useTimeParser'
import { TimeInfo } from './index'

export type TimeDifferenceInfo = ParsingResult & TimeInfo

const MINUTES_IN_AN_HOUR = 60

export const useTimeDiffCalculator = (
  timePairs: ParsingResult[]
): TimeDifferenceInfo[] =>
  timePairs.map((timePair) => {
    const diffInMinutes = timePair.to.diff(timePair.from, 'minute')
    const minutes = diffInMinutes % MINUTES_IN_AN_HOUR

    return {
      ...timePair,
      hours: (diffInMinutes - minutes) / MINUTES_IN_AN_HOUR,
      minutes,
    }
  })
