import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { TimeDiffTable } from './index'
import { TimeParsingError } from '../../errors/TimeParsingError'
import { FutureStartError } from '../../errors/FutureStartError'
import { DayGroup, DayGroupRow, Pause, TimeDifferenceInfo } from '../../types'
import {
  aggregatePauses,
  aggregateTimeDifference,
} from '../aggregateTimeDifference'

const entry = (
  from: string,
  to: string,
  hours: number,
  minutes: number,
): TimeDifferenceInfo => ({
  from: dayjs(`2026-09-20T${from}:00`),
  to: dayjs(`2026-09-20T${to}:00`),
  hours,
  minutes,
})

const pause: Pause = {
  between: {
    start: entry('09:00', '12:00', 3, 0),
    end: entry('13:00', '17:00', 4, 0),
  },
  pause: { hours: 1, minutes: 0 },
}

const day = (rows: DayGroupRow[], label?: string): DayGroup => ({
  label,
  rows,
  total: aggregateTimeDifference(rows),
  pauseTotal: aggregatePauses(rows),
})

const renderTable = (days: DayGroup[], showPauses = false) => {
  const allRows = days.flatMap((d) => d.rows)
  return render(
    <TimeDiffTable
      days={days}
      totalTime={aggregateTimeDifference(allRows)}
      totalPauseTime={aggregatePauses(allRows)}
      config={{ showPauses }}
    />,
  )
}

describe('TimeDiffTable', () => {
  it('renders an entry with its range and duration', () => {
    renderTable([day([entry('09:00', '12:30', 3, 30)])])

    expect(screen.getByText('09.00 - 12.30')).toBeInTheDocument()
    expect(screen.getByText('3h 30m')).toBeInTheDocument()
  })

  it('shows an open-ended entry as running until now', () => {
    const running = { ...entry('09:00', '15:30', 6, 30), isOpenEnded: true }
    renderTable([day([running])])

    expect(screen.getByText('09.00 - now')).toBeInTheDocument()
  })

  it('always renders the overall total', () => {
    renderTable([day([entry('09:00', '12:00', 3, 0)])])

    expect(screen.getByText('3 Hours 0 Minutes')).toBeInTheDocument()
  })

  it('hides pause rows when showPauses is off', () => {
    renderTable([day([entry('09:00', '12:00', 3, 0), pause])], false)

    expect(screen.queryByText(/Pause in between/)).not.toBeInTheDocument()
  })

  it('shows pause rows when showPauses is on', () => {
    renderTable([day([entry('09:00', '12:00', 3, 0), pause])], true)

    expect(screen.getByText(/Pause in between/)).toBeInTheDocument()
    expect(screen.getByText('{ 1h 0m }')).toBeInTheDocument()
  })

  it('renders a parsing error with the offending input', () => {
    renderTable([day([new TimeParsingError('nope', 'garbage line')])])

    expect(
      screen.getByText('Could not parse this input: "garbage line"'),
    ).toBeInTheDocument()
  })

  it('renders a future start error', () => {
    renderTable([day([new FutureStartError('20.00')])])

    expect(screen.getByText('20.00 has not started yet')).toBeInTheDocument()
  })

  it('renders a note line as plain text', () => {
    renderTable([day([{ note: 'booked on another day' }])])

    expect(screen.getByText('booked on another day')).toBeInTheDocument()
  })

  describe('several days', () => {
    const days = [
      day([entry('08:00', '16:30', 8, 30)]),
      day([entry('09:00', '11:00', 2, 0)], 'Samstag'),
    ]

    it('labels each day that has a header', () => {
      renderTable(days)

      expect(screen.getByText('Samstag')).toBeInTheDocument()
    })

    it('shows a subtotal per day alongside the overall total', () => {
      renderTable(days)

      // Each day's duration shows twice: once on the entry, once as subtotal.
      expect(screen.getAllByText('8h 30m')).toHaveLength(2)
      expect(screen.getAllByText('2h 0m')).toHaveLength(2)
      expect(screen.getByText('10 Hours 30 Minutes')).toBeInTheDocument()
    })

    it('does not add a subtotal for a single day', () => {
      renderTable([day([entry('09:00', '12:30', 3, 30)])])

      // The duration cell is the only 3h 30m; a subtotal would duplicate it.
      expect(screen.getAllByText('3h 30m')).toHaveLength(1)
    })
  })
})
