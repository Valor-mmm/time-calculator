import { FC } from 'react'
import { NoteLine } from '../../types'

interface NoteRowProps {
  line: NoteLine
}

export const NoteRow: FC<NoteRowProps> = ({ line }) => (
  <tr>
    <td colSpan={3} className="p-1 italic text-gray-500 dark:text-gray-400">
      {line.note}
    </td>
  </tr>
)
