import { Pause } from '../../types'

interface PauseRowProps {
  pause: Pause
}

export const PauseRow = ({ pause }: PauseRowProps) => {
  return (
    <tr>
      <td colSpan={3}>
        <div className="flex justify-between">
          <span className="italic">Pause in between {'--->'}</span>
          <span className="font-extralight">{`{ ${pause.pause.hours}h ${pause.pause.minutes}m }`}</span>
        </div>
      </td>
    </tr>
  )
}
