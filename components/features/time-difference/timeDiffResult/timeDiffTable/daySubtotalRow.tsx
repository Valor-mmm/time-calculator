import { FC } from 'react'
import { TimeInfo } from '../../types'

interface DaySubtotalRowProps {
  total: TimeInfo
}

export const DaySubtotalRow: FC<DaySubtotalRowProps> = ({ total }) => (
  <tr>
    <td className="p-1" colSpan={2}>
      <div className="border-t border-gray-400 border-opacity-50" />
    </td>
    <td className="p-1 text-right whitespace-nowrap">
      <div className="border-t border-gray-400 border-opacity-50 pt-1">
        {`${total.hours}h ${total.minutes}m`}
      </div>
    </td>
  </tr>
)
