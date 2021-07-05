import { TimeDifferenceError } from '../../errors'
import { FC } from 'react'
import { TimeParsingError } from '../../errors/TimeParsingError'

interface TimeDiffErrorRowProps {
  error: TimeDifferenceError
}

const determineErrorMessage = (error: TimeDifferenceError): string => {
  if (error instanceof TimeParsingError) {
    return `Could not parse this input: "${error.parsedString}"`
  }

  return `An unexpected error happened: ${error.message}`
}

export const TimeDiffErrorRow: FC<TimeDiffErrorRowProps> = ({ error }) => {
  const errorMessage = determineErrorMessage(error)

  return (
    <tr>
      <td className="text-red-300" colSpan={3}>
        {errorMessage}
      </td>
    </tr>
  )
}
