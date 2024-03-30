import { FC, useMemo } from 'react'
import { TimeDifferenceError } from '../../errors'
import { TimeDiffErrorRow } from './timeDiffErrorRow'
import { isPause } from '../../pauses'
import { PauseRow } from './pauseRow'
import type {
  TimeDiffConfig,
  TimeDiffRow as TimeDiffRowType,
  TimeInfo,
} from '../../types'
import { TimeDiffRow } from './timeDiffRow'

interface TimeDiffTableProps {
  totalTime: TimeInfo
  totalPauseTime: TimeInfo
  timeDifferences: TimeDiffRowType[]
  config: TimeDiffConfig
}

export const TimeDiffTable: FC<TimeDiffTableProps> = ({
  totalTime,
  totalPauseTime,
  timeDifferences,
  config,
}) => {
  const rows = useMemo(
    () =>
      timeDifferences.filter((row) => {
        return config.showPauses || !isPause(row)
      }),
    [config, timeDifferences],
  )

  return (
    <table className="border-collapse">
      <tbody>
        {rows.map((difference, index) => {
          if (difference instanceof TimeDifferenceError) {
            return <TimeDiffErrorRow key={index} error={difference} />
          } else if (isPause(difference)) {
            return <PauseRow key={index} pause={difference} />
          }

          return <TimeDiffRow key={index} {...difference} />
        })}
      </tbody>
      <tfoot>
        <tr>
          <td className="p-1" colSpan={3}>
            <div className="border-2 border-gray-400 border-opacity-60" />
          </td>
        </tr>
        <tr>
          <th colSpan={2} />
          <th className="p-1 text-right">{`${totalTime.hours} Hours ${totalTime.minutes} Minutes`}</th>
        </tr>
        {config.showPauses ? (
          <tr>
            <th colSpan={2} />
            <th className="p-1 text-right font-extralight">{`{ ${totalPauseTime.hours} Hours ${totalPauseTime.minutes} Minutes }`}</th>
          </tr>
        ) : null}
      </tfoot>
    </table>
  )
}
