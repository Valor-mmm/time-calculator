import { FC, useMemo } from 'react'
import { TimeDifferenceError } from '../../errors'
import { TimeDiffErrorRow } from './timeDiffErrorRow'
import { isPause } from '../../pauses'
import { PauseRow } from './pauseRow'
import {
  isNoteLine,
  type DayGroupRow,
  type DayGroup,
  type TimeDiffConfig,
  type TimeInfo,
} from '../../types'
import { TimeDiffRow } from './timeDiffRow'
import { NoteRow } from './noteRow'
import { DayHeaderRow } from './dayHeaderRow'
import { DaySubtotalRow } from './daySubtotalRow'

interface TimeDiffTableProps {
  totalTime: TimeInfo
  totalPauseTime: TimeInfo
  days: DayGroup[]
  config: TimeDiffConfig
}

export const TimeDiffTable: FC<TimeDiffTableProps> = ({
  totalTime,
  totalPauseTime,
  days,
  config,
}) => {
  const visibleDays = useMemo(
    () =>
      days.map((day) => ({
        ...day,
        rows: day.rows.filter(
          (row: DayGroupRow) => config.showPauses || !isPause(row),
        ),
      })),
    [config, days],
  )

  // A single unlabelled day is the everyday case: no day scaffolding, no
  // subtotal that would only repeat the total below it.
  const showDayBreakdown = visibleDays.length > 1

  return (
    <table className="border-collapse">
      {visibleDays.map((day, dayIndex) => (
        <tbody key={dayIndex}>
          {day.label ? (
            <DayHeaderRow
              header={{ label: day.label }}
              isFirst={dayIndex === 0}
            />
          ) : null}
          {day.rows.map((row, index) => {
            if (row instanceof TimeDifferenceError) {
              return <TimeDiffErrorRow key={index} error={row} />
            }
            if (isNoteLine(row)) {
              return <NoteRow key={index} line={row} />
            }
            if (isPause(row)) {
              return <PauseRow key={index} pause={row} />
            }

            return <TimeDiffRow key={index} {...row} />
          })}
          {showDayBreakdown ? <DaySubtotalRow total={day.total} /> : null}
        </tbody>
      ))}
      <tfoot>
        <tr>
          <td className="p-1" colSpan={3}>
            <div className="border-2 border-gray-400 border-opacity-60" />
          </td>
        </tr>
        <tr>
          <th colSpan={2} />
          <th className="p-1 text-right whitespace-nowrap">{`${totalTime.hours} Hours ${totalTime.minutes} Minutes`}</th>
        </tr>
        {config.showPauses ? (
          <tr>
            <th colSpan={2} />
            <th className="p-1 text-right font-extralight whitespace-nowrap">{`{ ${totalPauseTime.hours} Hours ${totalPauseTime.minutes} Minutes }`}</th>
          </tr>
        ) : null}
      </tfoot>
    </table>
  )
}
