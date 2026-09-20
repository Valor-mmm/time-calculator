import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  aggregatePauses,
  aggregateTimeDifference,
} from './aggregateTimeDifference'
import { TimeParsingError } from '../errors/TimeParsingError'
import { Pause, TimeDifferenceInfo, TimeInfo } from '../types'

const entry = (hours: number, minutes: number): TimeDifferenceInfo => ({
  from: dayjs('2026-09-20T09:00:00'),
  to: dayjs('2026-09-20T09:00:00'),
  hours,
  minutes,
})

const pause = (time: TimeInfo): Pause => ({
  between: { start: entry(0, 0), end: entry(0, 0) },
  pause: time,
})

describe('aggregateTimeDifference', () => {
  it('sums entry durations', () => {
    expect(aggregateTimeDifference([entry(1, 30), entry(2, 15)])).toEqual({
      hours: 3,
      minutes: 45,
    })
  })

  it('carries minutes over into hours', () => {
    expect(aggregateTimeDifference([entry(1, 40), entry(0, 30)])).toEqual({
      hours: 2,
      minutes: 10,
    })
  })

  it('carries an exact hour without leaving 60 minutes', () => {
    expect(aggregateTimeDifference([entry(0, 30), entry(0, 30)])).toEqual({
      hours: 1,
      minutes: 0,
    })
  })

  it('carries repeatedly across many entries', () => {
    const entries = Array.from({ length: 5 }, () => entry(0, 50))

    expect(aggregateTimeDifference(entries)).toEqual({ hours: 4, minutes: 10 })
  })

  it('skips pause rows', () => {
    expect(
      aggregateTimeDifference([entry(1, 0), pause({ hours: 5, minutes: 0 })]),
    ).toEqual({ hours: 1, minutes: 0 })
  })

  it('skips headers and notes', () => {
    expect(
      aggregateTimeDifference([
        { label: 'Samstag' },
        entry(1, 0),
        { note: 'booked elsewhere' },
      ]),
    ).toEqual({ hours: 1, minutes: 0 })
  })

  it('skips error rows', () => {
    expect(
      aggregateTimeDifference([
        entry(1, 0),
        new TimeParsingError('nope', 'x'),
        entry(2, 0),
      ]),
    ).toEqual({ hours: 3, minutes: 0 })
  })

  it('returns zero for an empty list', () => {
    expect(aggregateTimeDifference([])).toEqual({ hours: 0, minutes: 0 })
  })
})

describe('aggregatePauses', () => {
  it('sums pause durations', () => {
    expect(
      aggregatePauses([
        pause({ hours: 0, minutes: 45 }),
        pause({ hours: 1, minutes: 30 }),
      ]),
    ).toEqual({ hours: 2, minutes: 15 })
  })

  it('skips entries, headers, notes and errors', () => {
    expect(
      aggregatePauses([
        entry(8, 0),
        { label: 'Samstag' },
        { note: 'booked elsewhere' },
        new TimeParsingError('nope', 'x'),
        pause({ hours: 0, minutes: 30 }),
      ]),
    ).toEqual({ hours: 0, minutes: 30 })
  })

  it('returns zero for an empty list', () => {
    expect(aggregatePauses([])).toEqual({ hours: 0, minutes: 0 })
  })
})
