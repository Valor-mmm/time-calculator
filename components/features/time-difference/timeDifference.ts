import { ParsingResult } from './parseTime'
import { TimeInfo } from './index'
import { TimeDifferenceError } from './errors'

export type TimeDifferenceInfo = ParsingResult & TimeInfo

export type TimeDifferenceInfoOrError =
  | (ParsingResult & TimeInfo)
  | TimeDifferenceError

const MINUTES_IN_AN_HOUR = 60

export const timeDifference = (
  timePairs: (ParsingResult | TimeDifferenceError)[],
): TimeDifferenceInfoOrError[] =>
  timePairs.map((timePair) => {
    if (timePair instanceof TimeDifferenceError) {
      return timePair
    }

    const diffInMinutes = timePair.to.diff(timePair.from, 'minute')
    const minutes = diffInMinutes % MINUTES_IN_AN_HOUR

    return {
      ...timePair,
      hours: (diffInMinutes - minutes) / MINUTES_IN_AN_HOUR,
      minutes,
    }
  })
