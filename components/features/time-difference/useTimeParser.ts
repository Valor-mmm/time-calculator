import dayjs from 'dayjs'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'

const validationRegex =
  /(\d{1,2})[:.,](\d{1,2})[.\s]*-?(?:[.\s]*(\d{1,2})[:.,](\d{1,2}))?/

export interface ParsingResult {
  from: dayjs.Dayjs
  to: dayjs.Dayjs
}

export const useTimeParser = (
  timeInput: string
): (ParsingResult | TimeDifferenceError)[] =>
  timeInput.split('\n').map((timeDiff) => {
    const result = timeDiff.trim().match(validationRegex)
    if (!result) {
      return new TimeParsingError(
        'Could not parse provided time difference.',
        timeDiff
      )
    }

    const from = dayjs()
      .set('hour', parseInt(result[1]))
      .set('minute', parseInt(result[2]))
      .set('second', 0)

    let to = dayjs(new Date())
    if (result[3] && result[4]) {
      to = to
        .set('hour', parseInt(result[3]))
        .set('minute', parseInt(result[4]))
        .set('second', 0)
    }

    return { from, to }
  })
