import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { calculateRows, TimeDifference } from './index'
import {
  aggregatePauses,
  aggregateTimeDifference,
} from './timeDiffResult/aggregateTimeDifference'
import { groupByDay } from './timeDiffResult/groupByDay'
import { TimeDifferenceError } from './errors'
import { TimeParsingError } from './errors/TimeParsingError'
import { FutureStartError } from './errors/FutureStartError'

const NOW = new Date('2026-09-20T15:30:00')

const workedTotal = (input: string) =>
  aggregateTimeDifference(calculateRows(input))

const pauseTotal = (input: string) => aggregatePauses(calculateRows(input))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the full pipeline', () => {
  it('sums a normal working day', () => {
    expect(workedTotal('09.00 - 12.30\n13.00 - 17.00')).toEqual({
      hours: 7,
      minutes: 30,
    })
  })

  it('reports the lunch break as the pause total', () => {
    expect(pauseTotal('09.00 - 12.30\n13.00 - 17.00')).toEqual({
      hours: 0,
      minutes: 30,
    })
  })

  it('returns nothing for blank input', () => {
    expect(calculateRows('')).toEqual([])
    expect(calculateRows('   \n  \n')).toEqual([])
  })

  describe('regression: durations must never go negative', () => {
    it('counts a night shift across midnight as positive time', () => {
      expect(workedTotal('22.00 - 02.00')).toEqual({ hours: 4, minutes: 0 })
    })

    it('keeps a shift after midnight chronological', () => {
      expect(workedTotal('22.00 - 02.00\n03.00 - 05.00')).toEqual({
        hours: 6,
        minutes: 0,
      })
      expect(pauseTotal('22.00 - 02.00\n03.00 - 05.00')).toEqual({
        hours: 1,
        minutes: 0,
      })
    })

    it('treats a backwards time as the clock passing midnight', () => {
      expect(workedTotal('09.00 - 12.00\n08.00 - 10.00')).toEqual({
        hours: 5,
        minutes: 0,
      })
    })

    it('rejects an out-of-range time rather than rolling it over', () => {
      const rows = calculateRows('99.99')

      expect(rows[0]).toBeInstanceOf(TimeParsingError)
      expect(workedTotal('99.99')).toEqual({ hours: 0, minutes: 0 })
    })

    it('counts a shift that stops before midnight and resumes after it', () => {
      expect(workedTotal('20.00 - 23.00\n01.00 - 04.00')).toEqual({
        hours: 6,
        minutes: 0,
      })
      expect(pauseTotal('20.00 - 23.00\n01.00 - 04.00')).toEqual({
        hours: 2,
        minutes: 0,
      })
    })

    it('rejects an open entry that has not started yet', () => {
      const rows = calculateRows('20.00')

      expect(rows[0]).toBeInstanceOf(FutureStartError)
      expect(workedTotal('20.00')).toEqual({ hours: 0, minutes: 0 })
    })

    it('does not let a future open entry inflate a later one', () => {
      expect(workedTotal('20.00\n09.00 - 10.00')).toEqual({
        hours: 1,
        minutes: 0,
      })
    })

    it('rejects a time whose digits cannot be a time of day', () => {
      expect(calculateRows('123.45')[0]).toBeInstanceOf(TimeParsingError)
      expect(calculateRows('109.00 - 112.30')[0]).toBeInstanceOf(
        TimeParsingError,
      )
      expect(calculateRows('09.00 - 123.45')[0]).toBeInstanceOf(
        TimeParsingError,
      )
    })

    it('never produces a negative worked total for mixed input', () => {
      const total = workedTotal(
        '22.00 - 02.00\nnonsense\n09.00 - 12.00\n08.00 - 10.00',
      )

      expect(total.hours).toBeGreaterThanOrEqual(0)
      expect(total.minutes).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('a pasted notes page', () => {
  it('sums a normal weekday with a still-running entry', () => {
    const input = '08.00 - 12.00\n12.30 - 15.00\n15.15'

    expect(workedTotal(input)).toEqual({ hours: 6, minutes: 45 })
    expect(pauseTotal(input)).toEqual({ hours: 0, minutes: 45 })
  })

  it('splits a Friday-to-Sunday page into a day per header', () => {
    const days = groupByDay(
      calculateRows(
        '08.00 - 16.30\nSamstag:\n09.00 - 11.00\nSonntag:\n10.00 - 12.00',
      ),
    )

    expect(days).toHaveLength(3)
    expect(days.map((day) => day.label)).toEqual([
      undefined,
      'Samstag',
      'Sonntag',
    ])
    expect(days.map((day) => day.total)).toEqual([
      { hours: 8, minutes: 30 },
      { hours: 2, minutes: 0 },
      { hours: 2, minutes: 0 },
    ])
  })

  it('totals the whole page across its days', () => {
    const input =
      '08.00 - 16.30\nSamstag:\n09.00 - 11.00\nSonntag:\n10.00 - 12.00'

    expect(workedTotal(input)).toEqual({ hours: 12, minutes: 30 })
  })

  it('does not count the gap between two work days as a pause', () => {
    const input = '08.00 - 16.30\nSamstag:\n09.00 - 11.00'

    expect(pauseTotal(input)).toEqual({ hours: 0, minutes: 0 })
  })

  it('does count a gap that merely crosses midnight', () => {
    // A night shift taking a break at midnight is one work day, not two.
    const input = '20.00 - 23.00\n01.00 - 04.00'

    expect(workedTotal(input)).toEqual({ hours: 6, minutes: 0 })
    expect(pauseTotal(input)).toEqual({ hours: 2, minutes: 0 })
  })

  it('keeps a prose note without turning it into an error', () => {
    const rows = calculateRows(
      '08.00 - 12.00\nauf Mittwoch gebucht\n13.00 - 17.00',
    )

    expect(rows.some((row) => row instanceof TimeParsingError)).toBe(false)
    expect(
      workedTotal('08.00 - 12.00\nauf Mittwoch gebucht\n13.00 - 17.00'),
    ).toEqual({ hours: 8, minutes: 0 })
  })

  it('produces one unlabelled day for an ordinary single-day page', () => {
    const days = groupByDay(calculateRows('09.00 - 12.30\n13.00 - 17.00'))

    expect(days).toHaveLength(1)
    expect(days[0].label).toBeUndefined()
  })

  it('reports no errors at all for a plain pasted week', () => {
    const rows = calculateRows(
      '08.00 - 16.30\n08.00 - 16.30\n08.00 - 16.30\n08.00 - 13.00',
    )

    expect(rows.some((row) => row instanceof TimeDifferenceError)).toBe(false)
    expect(
      workedTotal('08.00 - 16.30\n08.00 - 16.30\n08.00 - 16.30\n08.00 - 13.00'),
    ).toEqual({ hours: 30, minutes: 30 })
  })
})

describe('TimeDifference', () => {
  it('renders the result only after the textarea loses focus', async () => {
    const user = userEvent.setup()
    render(<TimeDifference />)

    const textarea = screen.getByPlaceholderText(/Enter your times here/)
    await user.type(textarea, '09.00 - 12.30')

    expect(screen.queryByText('3h 30m')).not.toBeInTheDocument()

    await user.tab()

    expect(screen.getByText('09.00 - 12.30')).toBeInTheDocument()
    expect(screen.getByText('3h 30m')).toBeInTheDocument()
    expect(screen.getByText('3 Hours 30 Minutes')).toBeInTheDocument()
  })

  it('clears the result when the input is emptied again', async () => {
    const user = userEvent.setup()
    render(<TimeDifference />)

    const textarea = screen.getByPlaceholderText(/Enter your times here/)
    await user.type(textarea, '09.00 - 12.30')
    await user.tab()
    expect(screen.getByText('3h 30m')).toBeInTheDocument()

    await user.clear(textarea)
    await user.tab()

    expect(screen.queryByText('3h 30m')).not.toBeInTheDocument()
    expect(screen.getByText('0 Hours 0 Minutes')).toBeInTheDocument()
  })

  it('toggles pause rows through the config checkbox and remembers the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<TimeDifference />)

    const textarea = screen.getByPlaceholderText(/Enter your times here/)
    await user.type(textarea, '09.00 - 12.00{Enter}13.00 - 17.00')
    await user.tab()

    expect(screen.queryByText(/Pause in between/)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Show Pauses:'))
    expect(screen.getByText(/Pause in between/)).toBeInTheDocument()

    unmount()
    render(<TimeDifference />)
    expect(screen.getByLabelText('Show Pauses:')).toBeChecked()
  })
})
