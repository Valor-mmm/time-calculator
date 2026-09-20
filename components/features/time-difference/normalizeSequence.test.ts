import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { normalizeSequence } from './normalizeSequence'
import { parseTime, ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'

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

  it('returns an empty list for no entries', () => {
    expect(normalizeSequence([])).toEqual([])
  })

  it('keeps a lone error untouched', () => {
    const error = new TimeDifferenceError('boom')

    expect(normalizeSequence([error])).toEqual([error])
  })
})
