import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { normalizeSequence } from './normalizeSequence'
import { parseTime, ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'
import { FutureStartError } from './errors/FutureStartError'
import { isDayHeader, isNoteLine } from './types'

const NOW = new Date('2026-09-20T15:30:00')

const normalized = (input: string) =>
  normalizeSequence(parseTime(input)) as ParsingResult[]

/** Only the time entries, with headers, notes and errors filtered out. */
const entriesOf = (input: string): ParsingResult[] =>
  normalizeSequence(parseTime(input)).filter(
    (line): line is ParsingResult =>
      !(line instanceof TimeDifferenceError) &&
      !isDayHeader(line) &&
      !isNoteLine(line),
  )

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('normalizeSequence', () => {
  it('leaves a chronological sequence untouched', () => {
    const [first, second] = normalized('09.00 - 12.00\n13.00 - 17.00')

    expect(first.from.format('DD HH:mm')).toBe('20 09:00')
    expect(first.to.format('DD HH:mm')).toBe('20 12:00')
    expect(second.from.format('DD HH:mm')).toBe('20 13:00')
  })

  it('rolls an entry that crosses midnight onto the next day', () => {
    const [entry] = normalized('22.00 - 02.00')

    expect(entry.from.format('DD HH:mm')).toBe('20 22:00')
    expect(entry.to.format('DD HH:mm')).toBe('21 02:00')
    expect(entry.to.isAfter(entry.from)).toBe(true)
  })

  it('carries the day offset to every following entry', () => {
    const [night, morning] = normalized('22.00 - 02.00\n03.00 - 05.00')

    expect(night.to.format('DD HH:mm')).toBe('21 02:00')
    expect(morning.from.format('DD HH:mm')).toBe('21 03:00')
    expect(morning.to.format('DD HH:mm')).toBe('21 05:00')
    expect(morning.from.isAfter(night.to)).toBe(true)
  })

  it('handles several midnight crossings in a row', () => {
    const [first, second] = normalized('22.00 - 02.00\n23.00 - 01.00')

    expect(first.to.format('DD HH:mm')).toBe('21 02:00')
    expect(second.from.format('DD HH:mm')).toBe('21 23:00')
    expect(second.to.format('DD HH:mm')).toBe('22 01:00')
  })

  describe('a time that goes backwards', () => {
    it('rolls a shift that stops before midnight and resumes after it', () => {
      const [evening, night] = normalized('20.00 - 23.00\n01.00 - 04.00')

      expect(evening.to.format('DD HH:mm')).toBe('20 23:00')
      expect(night.from.format('DD HH:mm')).toBe('21 01:00')
      expect(night.to.format('DD HH:mm')).toBe('21 04:00')
    })

    it('handles a crossing that spans only minutes', () => {
      const [before, after] = normalized('23.00 - 23.30\n00.30 - 01.00')

      expect(before.to.format('DD HH:mm')).toBe('20 23:30')
      expect(after.from.format('DD HH:mm')).toBe('21 00:30')
    })

    it('rolls a new work day with no regard for how large the gap is', () => {
      // A pasted Friday-to-Sunday page: Friday knocks off at 16.30 and
      // Saturday starts at 04.00, a sixteen hour gap that is still just the
      // next day.
      const [friday, saturday] = entriesOf(
        '08.00 - 16.30\nSamstag:\n04.00 - 08.00',
      )

      expect(friday.to.format('DD HH:mm')).toBe('20 16:30')
      expect(saturday.from.format('DD HH:mm')).toBe('21 04:00')
      expect(saturday.to.format('DD HH:mm')).toBe('21 08:00')
    })

    it('rolls a whole pasted work week without complaint', () => {
      const entries = normalized(
        '08.00 - 16.30\n08.00 - 16.30\n08.00 - 16.30\n08.00 - 13.00',
      )

      expect(entries.map((e) => e.from.format('DD HH:mm'))).toEqual([
        '20 08:00',
        '21 08:00',
        '22 08:00',
        '23 08:00',
      ])
      expect(entries.every((e) => e.to.isAfter(e.from))).toBe(true)
    })
  })

  describe('open-ended entries', () => {
    it('ends an open entry at the current time', () => {
      const [entry] = normalized('09.00')

      expect(entry.from.format('DD HH:mm')).toBe('20 09:00')
      expect(entry.to.format('DD HH:mm')).toBe('20 15:30')
    })

    it('rejects an open entry whose start has not happened yet', () => {
      const [error] = normalizeSequence(parseTime('20.00'))

      expect(error).toBeInstanceOf(FutureStartError)
      expect((error as FutureStartError).start).toBe('20.00')
    })

    it('does not let a rejected open entry shift later entries', () => {
      const entries = normalizeSequence(parseTime('20.00\n09.00 - 10.00'))

      expect(entries[0]).toBeInstanceOf(FutureStartError)

      const later = entries[1] as ParsingResult
      expect(later.from.format('DD HH:mm')).toBe('20 09:00')
      expect(later.to.format('DD HH:mm')).toBe('20 10:00')
    })

    it('rejects an open entry once the sequence has passed midnight', () => {
      const entries = normalizeSequence(parseTime('22.00 - 02.00\n03.00'))

      expect(entries[1]).toBeInstanceOf(FutureStartError)
    })
  })

  describe('non-time lines', () => {
    it('passes a day header through without shifting the offset itself', () => {
      const lines = normalizeSequence(
        parseTime('09.00 - 12.00\nSamstag:\n13.00 - 17.00'),
      )

      expect(isDayHeader(lines[1])).toBe(true)

      const second = lines[2] as ParsingResult
      expect(second.from.format('DD HH:mm')).toBe('20 13:00')
    })

    it('passes a note through untouched', () => {
      const lines = normalizeSequence(
        parseTime('09.00 - 12.00\nbooked on another day'),
      )

      expect(isNoteLine(lines[1])).toBe(true)
    })

    it('passes errors through without resetting the day offset', () => {
      const input = '22.00 - 02.00\n1x.00 - 12.00\n03.00 - 05.00'
      const lines = normalizeSequence(parseTime(input))

      expect(lines[1]).toBeInstanceOf(TimeParsingError)

      const [, morning] = entriesOf(input)
      expect(morning.from.format('DD HH:mm')).toBe('21 03:00')
    })
  })

  it('returns an empty list for no entries', () => {
    expect(normalizeSequence([])).toEqual([])
  })

  it('keeps a lone error untouched', () => {
    const error = new TimeDifferenceError('boom')

    expect(normalizeSequence([error])).toEqual([error])
  })
})
