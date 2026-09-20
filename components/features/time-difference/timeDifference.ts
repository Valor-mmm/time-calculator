import { TimeDifferenceError } from './errors'
import dayjs from 'dayjs'
import {
  isDayHeader,
  isNoteLine,
  ParsedLine,
  TimeDiffRow,
  TimeInfo,
} from './types'

const MINUTES_IN_AN_HOUR = 60

export const calculateTimeDiff = (
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): TimeInfo => {
  const diffInMinutes = to.diff(from, 'minute')
  const minutes = diffInMinutes % MINUTES_IN_AN_HOUR

  return { hours: (diffInMinutes - minutes) / MINUTES_IN_AN_HOUR, minutes }
}

export const timeDifference = (lines: ParsedLine[]): TimeDiffRow[] =>
  lines.map((line) => {
    if (
      line instanceof TimeDifferenceError ||
      isDayHeader(line) ||
      isNoteLine(line)
    ) {
      return line
    }

    return {
      ...line,
      ...calculateTimeDiff(line.from, line.to),
    }
  })
