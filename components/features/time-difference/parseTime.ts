import dayjs from 'dayjs'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'
import { ParsedLine } from './types'

/**
 * A time of day as `H.MM`, `H:MM` or `H,MM`, optionally followed by a second
 * one after an optional dash.
 *
 * The lookarounds matter: without them the engine backtracks past a leading
 * digit, so `123.45` would match as `23.45` and slip past the range check
 * below. Everything around the match stays untouched, so trailing notes such
 * as `09.00 - 12.30 lunch` still parse.
 */
const validationRegex =
  /(?<!\d)(\d{1,2})[:.,](\d{1,2})(?!\d)[.\s]*-?(?:[.\s]*(?<!\d)(\d{1,2})[:.,](\d{1,2})(?!\d))?/

/**
 * A run of three or more digits touching a time separator cannot be part of a
 * time of day. The main pattern would simply not match it and, where a valid
 * time precedes it, would drop it silently - so the line is rejected outright
 * instead. Digits elsewhere in the line (`09.00 - 12.30 room 101`) are fine.
 */
const malformedTimeRegex = /\d{3,}[:.,]|[:.,]\d{3,}/

/**
 * Digits touching a separator anywhere the match did not reach mean the line
 * held something time-shaped that was not understood — a typo such as
 * `1x.00 - 12.00`, or a second range crammed onto one line. Dropping it
 * silently would quietly change the total, so the line is rejected instead.
 */
const leftoverTimeRegex = /\d[:.,]|[:.,]\d/

const MAX_HOUR = 23
const MAX_MINUTE = 59

export interface ParsingResult {
  from: dayjs.Dayjs
  to: dayjs.Dayjs
  /** No end time was given, so `to` is the moment the input was parsed. */
  isOpenEnded?: boolean
}

export type ParsingResultOrError = ParsingResult | TimeDifferenceError

const containsDigit = /\d/

const isValidTime = (hour: number, minute: number): boolean =>
  hour <= MAX_HOUR && minute <= MAX_MINUTE

const atTime = (base: dayjs.Dayjs, hour: number, minute: number): dayjs.Dayjs =>
  base
    .set('hour', hour)
    .set('minute', minute)
    .set('second', 0)
    .set('millisecond', 0)

/**
 * Turns one pasted line into a parsed line.
 *
 * The notes being pasted are not a time format, they are notes. A line ending
 * in a colon (`Samstag:`) starts a new work day; prose without digits is kept
 * as a note; only a line that looks like it was *meant* to be a time and is
 * not becomes an error.
 */
export const parseTime = (timeInput: string): ParsedLine[] =>
  timeInput.split('\n').flatMap((timeDiff): ParsedLine[] => {
    const trimmed = timeDiff.trim()

    if (trimmed === '') {
      return []
    }

    if (trimmed.endsWith(':')) {
      return [{ label: trimmed.slice(0, -1).trim() || trimmed }]
    }

    const match = malformedTimeRegex.test(trimmed)
      ? null
      : trimmed.match(validationRegex)

    const result =
      match &&
      !leftoverTimeRegex.test(
        trimmed.slice(0, match.index) +
          trimmed.slice((match.index ?? 0) + match[0].length),
      )
        ? match
        : null

    if (!result) {
      return containsDigit.test(trimmed)
        ? [
            new TimeParsingError(
              'Could not parse provided time difference.',
              timeDiff,
            ),
          ]
        : [{ note: trimmed }]
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

    const now = dayjs().set('second', 0).set('millisecond', 0)
    const from = atTime(now, fromHour, fromMinute)

    if (!result[3] || !result[4]) {
      // An entry without an end time is still running, so it lasts until now.
      return [{ from, to: now, isOpenEnded: true }]
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
