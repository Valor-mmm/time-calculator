import { ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'
import dayjs from 'dayjs'
import { TimeDifferenceInfoOrError, TimeInfo } from './types'

const MINUTES_IN_AN_HOUR = 60

export const calculateTimeDiff = (
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): TimeInfo => {
  const diffInMinutes = to.diff(from, 'minute')
  const minutes = diffInMinutes % MINUTES_IN_AN_HOUR

  return { hours: (diffInMinutes - minutes) / MINUTES_IN_AN_HOUR, minutes }
}

export const timeDifference = (
  timePairs: (ParsingResult | TimeDifferenceError)[],
): TimeDifferenceInfoOrError[] =>
  timePairs.map((timePair) => {
    if (timePair instanceof TimeDifferenceError) {
      return timePair
    }

    return {
      ...timePair,
      ...calculateTimeDiff(timePair.from, timePair.to),
    }
  })
