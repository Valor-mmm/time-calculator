import { FC, useState } from 'react'
import { Textarea } from '../../lib/textarea/Textarea'
import { TimeDiffResult } from './timeDiffResult'
import { useTimeParser } from './useTimeParser'
import {
  TimeDifferenceInfo,
  useTimeDiffCalculator,
} from './useTimeDiffCalculator'

export interface TimeInfo {
  minutes: number
  hours: number
}

export type TimeDifferenceProps = Record<string, never>

export const TimeDifference: FC<TimeDifferenceProps> = () => {
  const [timeDifferences, setTimeDifferences] = useState<TimeDifferenceInfo[]>(
    []
  )

  const handleBlur = (inputValue: string) => {
    if (!inputValue) {
      setTimeDifferences([])
    }

    const parsedTime = useTimeParser(inputValue)
    setTimeDifferences(useTimeDiffCalculator(parsedTime))
  }

  return (
    <article className="container mx-auto px-2 grid grid-cols-1 gap-2 w-72 sm:w-80 md:w-3/6 md:gap-4 lg:grid-cols-2 lg:w-3/4">
      <Textarea
        autoFocus
        placeholder={'Enter your times here in the format of 10.20 - 14.13'}
        onBlur={(evt) => {
          const value = evt?.target?.value
          if (value || value === '') {
            handleBlur(value)
          }
        }}
      />
      <TimeDiffResult result={timeDifferences} />
    </article>
  )
}
