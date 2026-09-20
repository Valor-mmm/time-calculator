import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { calculatePauses, isPause } from './pauses'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'
import { Pause, TimeDifferenceInfo } from './types'

const entry = (from: string, to: string): TimeDifferenceInfo => {
  const start = dayjs(`2026-09-20T${from}:00`)
  const end = dayjs(`2026-09-20T${to}:00`)
  const diffInMinutes = end.diff(start, 'minute')

  return {
    from: start,
    to: end,
    hours: Math.floor(diffInMinutes / 60),
    minutes: diffInMinutes % 60,
  }
}

describe('isPause', () => {
  it('recognises a pause row', () => {
    const pause: Pause = {
      between: { start: entry('09:00', '12:00'), end: entry('13:00', '17:00') },
      pause: { hours: 1, minutes: 0 },
    }

    expect(isPause(pause)).toBe(true)
  })

  it('rejects an entry row', () => {
    expect(isPause(entry('09:00', '12:00'))).toBe(false)
  })

  it('rejects an error row', () => {
    expect(isPause(new TimeParsingError('nope', 'x'))).toBe(false)
  })

  it('rejects a header and a note', () => {
    expect(isPause({ label: 'Samstag' })).toBe(false)
    expect(isPause({ note: 'booked elsewhere' })).toBe(false)
  })
})

describe('calculatePauses', () => {
  it('inserts the gap between two entries', () => {
    const rows = calculatePauses([
      entry('09:00', '12:00'),
      entry('13:00', '17:00'),
    ])

    expect(rows).toHaveLength(3)
    expect(isPause(rows[1])).toBe(true)
    expect((rows[1] as Pause).pause).toEqual({ hours: 1, minutes: 0 })
  })

  it('keeps the entries themselves in order around the pause', () => {
    const first = entry('09:00', '12:00')
    const second = entry('13:00', '17:00')
    const rows = calculatePauses([first, second])

    expect(rows[0]).toBe(first)
    expect(rows[2]).toBe(second)
  })

  it('links the pause back to the entries it sits between', () => {
    const first = entry('09:00', '12:00')
    const second = entry('13:00', '17:00')
    const [, pause] = calculatePauses([first, second]) as [
      TimeDifferenceInfo,
      Pause,
      TimeDifferenceInfo,
    ]

    expect(pause.between.start).toBe(first)
    expect(pause.between.end).toBe(second)
  })

  it('emits a pause for every consecutive pair', () => {
    const rows = calculatePauses([
      entry('09:00', '10:00'),
      entry('11:00', '12:00'),
      entry('13:00', '14:00'),
    ])

    expect(rows.filter(isPause)).toHaveLength(2)
  })

  it('emits no pause for a single entry', () => {
    const rows = calculatePauses([entry('09:00', '12:00')])

    expect(rows).toHaveLength(1)
    expect(rows.filter(isPause)).toHaveLength(0)
  })

  it('emits a zero pause for back-to-back entries', () => {
    const rows = calculatePauses([
      entry('09:00', '12:00'),
      entry('12:00', '17:00'),
    ])

    expect((rows[1] as Pause).pause).toEqual({ hours: 0, minutes: 0 })
  })

  it('does not bridge a pause across a day header', () => {
    const rows = calculatePauses([
      entry('09:00', '16:30'),
      { label: 'Samstag' },
      entry('09:00', '11:00'),
    ])

    expect(rows).toHaveLength(3)
    expect(rows.filter(isPause)).toHaveLength(0)
  })

  it('still bridges a pause across a note', () => {
    const rows = calculatePauses([
      entry('09:00', '12:00'),
      { note: 'booked on another day' },
      entry('13:00', '17:00'),
    ])

    expect(rows.filter(isPause)).toHaveLength(1)
  })

  it('does not bridge a pause across an unreadable line', () => {
    const rows = calculatePauses([
      entry('09:00', '12:00'),
      new TimeParsingError('nope', 'garbage'),
      entry('13:00', '17:00'),
    ])

    expect(rows).toHaveLength(3)
    expect(rows.filter(isPause)).toHaveLength(0)
    expect(rows[1]).toBeInstanceOf(TimeDifferenceError)
  })

  it('returns an empty list for no entries', () => {
    expect(calculatePauses([])).toEqual([])
  })
})
