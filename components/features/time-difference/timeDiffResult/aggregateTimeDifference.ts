import { isPause } from '../pauses'
import { DayGroupRow, isTimeRow, TimeDiffRow, TimeInfo } from '../types'

const MINUTES_IN_AN_HOUR = 60

const zero: TimeInfo = { hours: 0, minutes: 0 }

const add = (agg: TimeInfo, time: TimeInfo): TimeInfo => {
  const hourSum = agg.hours + time.hours
  const minuteSum = agg.minutes + time.minutes
  const carry = minuteSum >= MINUTES_IN_AN_HOUR

  return {
    hours: hourSum + (carry ? 1 : 0),
    minutes: minuteSum - (carry ? MINUTES_IN_AN_HOUR : 0),
  }
}

/**
 * Sums the worked time in a row list. Pauses, headers, notes and errors are
 * skipped — use `aggregatePauses` for the other half.
 */
export const aggregateTimeDifference = (
  rows: (TimeDiffRow | DayGroupRow)[],
): TimeInfo =>
  rows.reduce(
    (agg, row) => (isTimeRow(row) && !isPause(row) ? add(agg, row) : agg),
    zero,
  )

/** Sums only the pause rows. */
export const aggregatePauses = (
  rows: (TimeDiffRow | DayGroupRow)[],
): TimeInfo =>
  rows.reduce(
    (agg, row) => (isTimeRow(row) && isPause(row) ? add(agg, row.pause) : agg),
    zero,
  )
