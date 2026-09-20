import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { TimeDiffTable } from './index'
import { TimeParsingError } from '../../errors/TimeParsingError'
import { TimeOrderError } from '../../errors/TimeOrderError'
import { Pause, TimeDifferenceInfo, TimeDiffRow } from '../../types'

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

const renderTable = (rows: TimeDiffRow[], showPauses = false) =>
  render(
    <TimeDiffTable
      timeDifferences={rows}
      totalTime={{ hours: 7, minutes: 0 }}
      totalPauseTime={{ hours: 1, minutes: 0 }}
      config={{ showPauses }}
    />,
  )

describe('TimeDiffTable', () => {
  it('renders an entry with its range and duration', () => {
    renderTable([entry('09:00', '12:30', 3, 30)])

    expect(screen.getByText('09.00 - 12.30')).toBeInTheDocument()
    expect(screen.getByText('3h 30m')).toBeInTheDocument()
  })

  it('always renders the worked total', () => {
    renderTable([entry('09:00', '12:00', 3, 0)])

    expect(screen.getByText('7 Hours 0 Minutes')).toBeInTheDocument()
  })

  it('hides pause rows when showPauses is off', () => {
    renderTable([entry('09:00', '12:00', 3, 0), pause], false)

    expect(screen.queryByText(/Pause in between/)).not.toBeInTheDocument()
  })

  it('shows pause rows when showPauses is on', () => {
    renderTable([entry('09:00', '12:00', 3, 0), pause], true)

    expect(screen.getByText(/Pause in between/)).toBeInTheDocument()
    expect(screen.getByText('{ 1h 0m }')).toBeInTheDocument()
  })

  it('shows the pause total only when showPauses is on', () => {
    const { unmount } = renderTable([pause], false)
    expect(screen.queryByText('{ 1 Hours 0 Minutes }')).not.toBeInTheDocument()
    unmount()

    renderTable([pause], true)
    expect(screen.getByText('{ 1 Hours 0 Minutes }')).toBeInTheDocument()
  })

  it('renders a parsing error with the offending input', () => {
    renderTable([new TimeParsingError('nope', 'garbage line')])

    expect(
      screen.getByText('Could not parse this input: "garbage line"'),
    ).toBeInTheDocument()
  })

  it('renders an order error naming both times', () => {
    renderTable([new TimeOrderError('12.00', '08.00')])

    expect(
      screen.getByText('08.00 starts before the previous entry ended at 12.00'),
    ).toBeInTheDocument()
  })

  it('renders nothing but the total for an empty result', () => {
    renderTable([])

    expect(screen.queryByText(/ - /)).not.toBeInTheDocument()
    expect(screen.getByText('7 Hours 0 Minutes')).toBeInTheDocument()
  })
})
