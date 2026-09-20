import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import dayjs from 'dayjs'
import { parseTime, ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'

const NOW = new Date('2026-09-20T15:30:00')

const asResults = (input: string): ParsingResult[] =>
  parseTime(input).filter(
    (entry): entry is ParsingResult => !(entry instanceof TimeDifferenceError),
  )

const hhmm = (time: dayjs.Dayjs) => time.format('HH:mm')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('parseTime', () => {
  it('parses a simple range', () => {
    const [entry] = asResults('09.00 - 12.30')

    expect(hhmm(entry.from)).toBe('09:00')
    expect(hhmm(entry.to)).toBe('12:30')
  })

  it.each([
    ['09:00 - 12:30', '09:00', '12:30'],
    ['09.00 - 12.30', '09:00', '12:30'],
    ['09,00 - 12,30', '09:00', '12:30'],
    ['9.00-12.30', '09:00', '12:30'],
    ['9.00 12.30', '09:00', '12:30'],
  ])('accepts the separator style %s', (input, from, to) => {
    const [entry] = asResults(input)

    expect(hhmm(entry.from)).toBe(from)
    expect(hhmm(entry.to)).toBe(to)
  })

  it('parses one entry per line and skips blank lines', () => {
    const entries = asResults('09.00 - 12.30\n\n  \n13.00 - 17.00')

    expect(entries).toHaveLength(2)
    expect(hhmm(entries[1].from)).toBe('13:00')
  })

  it('treats a missing end time as running until now', () => {
    const [entry] = asResults('09.00')

    expect(hhmm(entry.from)).toBe('09:00')
    expect(hhmm(entry.to)).toBe('15:30')
  })

  it('zeroes out seconds and milliseconds', () => {
    const [entry] = asResults('09.00 - 12.30')

    expect(entry.from.second()).toBe(0)
    expect(entry.from.millisecond()).toBe(0)
    expect(entry.to.second()).toBe(0)
    expect(entry.to.millisecond()).toBe(0)
  })

  it('reports an unparsable line as a TimeParsingError carrying the input', () => {
    const [error] = parseTime('not a time')

    expect(error).toBeInstanceOf(TimeParsingError)
    expect((error as TimeParsingError).parsedString).toBe('not a time')
  })

  it('keeps errors and valid entries in input order', () => {
    const entries = parseTime('09.00 - 10.00\nnonsense\n11.00 - 12.00')

    expect(entries).toHaveLength(3)
    expect(entries[1]).toBeInstanceOf(TimeParsingError)
    expect(entries[0]).not.toBeInstanceOf(TimeDifferenceError)
    expect(entries[2]).not.toBeInstanceOf(TimeDifferenceError)
  })

  describe('bounds validation', () => {
    it.each(['99.99', '24.00', '25.00 - 26.00', '12.60'])(
      'rejects out-of-range time %s instead of rolling it over',
      (input) => {
        const [error] = parseTime(input)

        expect(error).toBeInstanceOf(TimeParsingError)
      },
    )

    it('rejects an out-of-range end time', () => {
      const [error] = parseTime('09.00 - 24.00')

      expect(error).toBeInstanceOf(TimeParsingError)
    })

    it.each(['00.00 - 23.59', '23.59 - 00.00'])(
      'accepts the boundary value %s',
      (input) => {
        expect(asResults(input)).toHaveLength(1)
      },
    )
  })
})
