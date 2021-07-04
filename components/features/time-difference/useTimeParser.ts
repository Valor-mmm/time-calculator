import dayjs from 'dayjs'

const validationRegex = /(\d{1,2})[:.,](\d{1,2}).?-.?(\d{1,2})[:.,](\d{1,2})/

export interface ParsingResult {
  from: dayjs.Dayjs
  to: dayjs.Dayjs
}

export const useTimeParser = (timeInput: string): ParsingResult[] =>
  timeInput.split('\n').map((timeDiff) => {
    const result = timeDiff.trim().match(validationRegex)
    if (!result) {
      throw Error(`Times could not be parsed. Wrong format: ${timeDiff}`)
    }

    const from = dayjs()
      .set('hour', parseInt(result[1]))
      .set('minute', parseInt(result[2]))
      .set('second', 0)
    const to = dayjs()
      .set('hour', parseInt(result[3]))
      .set('minute', parseInt(result[4]))
      .set('second', 0)

    return { from, to }
  })
