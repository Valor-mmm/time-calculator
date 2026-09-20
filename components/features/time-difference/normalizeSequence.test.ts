import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { normalizeSequence } from './normalizeSequence'
import { parseTime, ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'
import { FutureStartError } from './errors/FutureStartError'

const NOW = new Date('2026-09-20T15:30:00')

const normalized = (input: string) =>
  normalizeSequence(parseTime(input)) as ParsingResult[]

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

  it('passes errors through without resetting the day offset', () => {
    const entries = normalizeSequence(
      parseTime('22.00 - 02.00\nnonsense\n03.00 - 05.00'),
    )

    expect(entries[1]).toBeInstanceOf(TimeParsingError)

    const morning = entries[2] as ParsingResult
    expect(morning.from.format('DD HH:mm')).toBe('21 03:00')
  })

  it('does not reorder out-of-order entries within the same day', () => {
    const [first, second] = normalized('09.00 - 12.00\n08.00 - 10.00')

    expect(first.to.format('DD HH:mm')).toBe('20 12:00')
    expect(second.from.format('DD HH:mm')).toBe('20 08:00')
  })

  describe('a shift resuming after midnight', () => {
    it('rolls an entry that starts before the previous one ended', () => {
      const [evening, night] = normalized('20.00 - 23.00\n01.00 - 04.00')

      expect(evening.to.format('DD HH:mm')).toBe('20 23:00')
      expect(night.from.format('DD HH:mm')).toBe('21 01:00')
      expect(night.to.format('DD HH:mm')).toBe('21 04:00')
      expect(night.from.isAfter(evening.to)).toBe(true)
    })

    it('handles a crossing that spans only minutes', () => {
      const [before, after] = normalized('23.00 - 23.30\n00.30 - 01.00')

      expect(before.to.format('DD HH:mm')).toBe('20 23:30')
      expect(after.from.format('DD HH:mm')).toBe('21 00:30')
    })

    it('rolls at exactly the 12 hour limit', () => {
      const [, second] = normalized('09.00 - 23.00\n11.00 - 12.00')

      expect(second.from.format('DD HH:mm')).toBe('21 11:00')
    })

    it('leaves an entry alone once the implied gap exceeds the limit', () => {
      // Rolling 11.01 forward would imply a 12h01 pause, which reads as a
      // typo rather than a shift resuming after midnight.
      const [, second] = normalized('09.00 - 23.00\n11.01 - 12.00')

      expect(second.from.format('DD HH:mm')).toBe('20 11:01')
    })

    it('leaves an ordinary out-of-order entry alone', () => {
      const [, second] = normalized('09.00 - 12.00\n08.00 - 10.00')

      expect(second.from.format('DD HH:mm')).toBe('20 08:00')
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

  it('returns an empty list for no entries', () => {
    expect(normalizeSequence([])).toEqual([])
  })

  it('keeps a lone error untouched', () => {
    const error = new TimeDifferenceError('boom')

    expect(normalizeSequence([error])).toEqual([error])
  })
})
