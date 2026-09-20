import { TimeDifferenceError } from '../../errors'
import { FC } from 'react'
import { TimeParsingError } from '../../errors/TimeParsingError'
import { FutureStartError } from '../../errors/FutureStartError'

const determineErrorMessage = (error: TimeDifferenceError): string => {
  if (error instanceof TimeParsingError) {
    return `Could not parse this input: "${error.parsedString}"`
  }

  if (error instanceof FutureStartError) {
    return `${error.start} has not started yet`
  }

  return `An unexpected error happened: ${error.message}`
}

interface TimeDiffErrorRowProps {
  error: TimeDifferenceError
}

export const TimeDiffErrorRow: FC<TimeDiffErrorRowProps> = ({ error }) => {
  const errorMessage = determineErrorMessage(error)

  return (
    <tr>
      <td className="text-red-300 dark:text-red-600" colSpan={3}>
        {errorMessage}
      </td>
    </tr>
  )
}
