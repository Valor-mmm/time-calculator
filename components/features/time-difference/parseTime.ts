import dayjs from 'dayjs'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'

const validationRegex =
  /(\d{1,2})[:.,](\d{1,2})[.\s]*-?(?:[.\s]*(\d{1,2})[:.,](\d{1,2}))?/

const MAX_HOUR = 23
const MAX_MINUTE = 59

export interface ParsingResult {
  from: dayjs.Dayjs
  to: dayjs.Dayjs
}

export type ParsingResultOrError = ParsingResult | TimeDifferenceError

const isValidTime = (hour: number, minute: number): boolean =>
  Number.isInteger(hour) &&
  Number.isInteger(minute) &&
  hour >= 0 &&
  hour <= MAX_HOUR &&
  minute >= 0 &&
  minute <= MAX_MINUTE

const atTime = (base: dayjs.Dayjs, hour: number, minute: number): dayjs.Dayjs =>
  base
    .set('hour', hour)
    .set('minute', minute)
    .set('second', 0)
    .set('millisecond', 0)

export const parseTime = (timeInput: string): ParsingResultOrError[] =>
  timeInput.split('\n').flatMap((timeDiff): ParsingResultOrError[] => {
    if (timeDiff.trim() === '') {
      return []
    }

    const result = timeDiff.trim().match(validationRegex)
    if (!result) {
      return [
        new TimeParsingError(
          'Could not parse provided time difference.',
          timeDiff,
        ),
      ]
    }

    const fromHour = parseInt(result[1], 10)
    const fromMinute = parseInt(result[2], 10)

    if (!isValidTime(fromHour, fromMinute)) {
      return [
        new TimeParsingError(
          `Invalid start time: ${fromHour}:${fromMinute} is not a time of day.`,
          timeDiff,
        ),
      ]
    }

    const now = dayjs()
    const from = atTime(now, fromHour, fromMinute)

    const hasEndTime = Boolean(result[3] && result[4])
    if (!hasEndTime) {
      // An entry without an end time is still running, so it lasts until now.
      return [{ from, to: now.set('second', 0).set('millisecond', 0) }]
    }

    const toHour = parseInt(result[3], 10)
    const toMinute = parseInt(result[4], 10)

    if (!isValidTime(toHour, toMinute)) {
      return [
        new TimeParsingError(
          `Invalid end time: ${toHour}:${toMinute} is not a time of day.`,
          timeDiff,
        ),
      ]
    }

    return [{ from, to: atTime(now, toHour, toMinute) }]
  })
