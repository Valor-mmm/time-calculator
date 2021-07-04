import { FC } from 'react'
import { TimeInfo } from '../../index'
import { TimeDiffRow } from './timeDiffRow'
import { TimeDifferenceInfo } from '../../useTimeDiffCalculator'

interface TimeDiffTableProps {
  totalTime: TimeInfo
  timeDifferences: TimeDifferenceInfo[]
}

export const TimeDiffTable: FC<TimeDiffTableProps> = ({
  totalTime,
  timeDifferences,
}) => {
  return (
    <table className="border-collapse">
      <tbody>
        {timeDifferences.map((difference, index) => (
          <TimeDiffRow key={index} {...difference} />
        ))}
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
      </tfoot>
    </table>
  )
}
