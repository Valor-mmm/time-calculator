import { FC } from 'react'
import { DayHeader } from '../../types'

interface DayHeaderRowProps {
  header: DayHeader
  isFirst: boolean
}

export const DayHeaderRow: FC<DayHeaderRowProps> = ({ header, isFirst }) => (
  <tr>
    <th
      colSpan={3}
      className={`text-left font-bold ${isFirst ? 'pb-1' : 'pt-4 pb-1'}`}
    >
      {header.label}
    </th>
  </tr>
)
