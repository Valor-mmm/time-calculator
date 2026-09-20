import { FC } from 'react'
import { TimeDifferenceInfo } from '../../types'

type TimeDiffRowProps = TimeDifferenceInfo

export const TimeDiffRow: FC<TimeDiffRowProps> = ({
  from,
  to,
  hours,
  minutes,
  isOpenEnded,
}) => {
  const range = `${from.format('HH.mm')} - ${isOpenEnded ? 'now' : to.format('HH.mm')}`

  return (
    <tr>
      <td className="p-1">
        <span className="bg-cyan-200 dark:bg-cyan-600 font-mono rounded-lg p-1 text-center">
          {range}
        </span>
      </td>
      <td className="p-1">:</td>
      <td className="p-1 text-right">{`${hours}h ${minutes}m`}</td>
    </tr>
  )
}
