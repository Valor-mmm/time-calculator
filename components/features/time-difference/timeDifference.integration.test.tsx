import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { calculateRows, TimeDifference } from './index'
import { aggregateTimeDifference } from './timeDiffResult/aggregateTimeDifference'
import { isPause } from './pauses'
import { TimeOrderError } from './errors/TimeOrderError'
import { TimeParsingError } from './errors/TimeParsingError'

const NOW = new Date('2026-09-20T15:30:00')

const workedTotal = (input: string) =>
  aggregateTimeDifference(calculateRows(input).filter((row) => !isPause(row)))

const pauseTotal = (input: string) =>
  aggregateTimeDifference(calculateRows(input).filter(isPause))

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

    it('flags out-of-order entries instead of subtracting from the total', () => {
      const rows = calculateRows('09.00 - 12.00\n08.00 - 10.00')

      expect(rows.some((row) => row instanceof TimeOrderError)).toBe(true)
      expect(pauseTotal('09.00 - 12.00\n08.00 - 10.00')).toEqual({
        hours: 0,
        minutes: 0,
      })
    })

    it('rejects an out-of-range time rather than rolling it over', () => {
      const rows = calculateRows('99.99')

      expect(rows[0]).toBeInstanceOf(TimeParsingError)
      expect(workedTotal('99.99')).toEqual({ hours: 0, minutes: 0 })
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
