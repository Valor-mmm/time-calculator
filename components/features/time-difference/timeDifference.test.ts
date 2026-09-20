import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { calculateTimeDiff, timeDifference } from './timeDifference'
import { TimeDifferenceError } from './errors'
import { TimeDifferenceInfo } from './types'

const at = (time: string) => dayjs(`2026-09-20T${time}:00`)

describe('calculateTimeDiff', () => {
  it.each([
    ['09:00', '12:30', 3, 30],
    ['09:00', '09:00', 0, 0],
    ['09:00', '09:59', 0, 59],
    ['09:00', '10:00', 1, 0],
    ['00:00', '23:59', 23, 59],
  ])('reports %s - %s as %ih %im', (from, to, hours, minutes) => {
    expect(calculateTimeDiff(at(from), at(to))).toEqual({ hours, minutes })
  })

  it('truncates seconds rather than rounding them up', () => {
    const from = dayjs('2026-09-20T09:00:00')
    const to = dayjs('2026-09-20T09:00:59')

    expect(calculateTimeDiff(from, to)).toEqual({ hours: 0, minutes: 0 })
  })

  it('spans a day boundary once normalized', () => {
    const from = dayjs('2026-09-20T22:00:00')
    const to = dayjs('2026-09-21T02:00:00')

    expect(calculateTimeDiff(from, to)).toEqual({ hours: 4, minutes: 0 })
  })
})

describe('timeDifference', () => {
  it('augments each entry with its duration', () => {
    const [entry] = timeDifference([
      { from: at('09:00'), to: at('12:30') },
    ]) as TimeDifferenceInfo[]

    expect(entry.hours).toBe(3)
    expect(entry.minutes).toBe(30)
    expect(entry.from.format('HH:mm')).toBe('09:00')
    expect(entry.to.format('HH:mm')).toBe('12:30')
  })

  it('passes errors through untouched', () => {
    const error = new TimeDifferenceError('boom')

    expect(timeDifference([error])).toEqual([error])
  })

  it('preserves order across a mixed list', () => {
    const error = new TimeDifferenceError('boom')
    const result = timeDifference([
      { from: at('09:00'), to: at('10:00') },
      error,
      { from: at('11:00'), to: at('12:00') },
    ])

    expect(result).toHaveLength(3)
    expect(result[1]).toBe(error)
  })

  it('returns an empty list for no entries', () => {
    expect(timeDifference([])).toEqual([])
  })
})
