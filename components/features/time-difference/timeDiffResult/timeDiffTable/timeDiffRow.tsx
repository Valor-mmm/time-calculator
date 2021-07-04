import { FC } from 'react'
import { TimeDifferenceInfo } from '../../useTimeDiffCalculator'

type TimeDiffRowProps = TimeDifferenceInfo

export const TimeDiffRow: FC<TimeDiffRowProps> = ({
  from,
  to,
  hours,
  minutes,
}) => {
  return (
    <tr>
      <td className="p-1">
        <span className="bg-cyan-200 font-mono rounded-lg p-1 text-center">
          {`${from.hour()}.${from.minute()} - ${to.hour()}.${to.minute()}`}
        </span>
      </td>
      <td className="p-1">:</td>
      <td className="p-1 text-right">{`${hours}h ${minutes}m`}</td>
    </tr>
  )
}
