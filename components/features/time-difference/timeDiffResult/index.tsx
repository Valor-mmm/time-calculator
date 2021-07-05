import { FC, useMemo } from 'react'
import { TimeDiffTable } from './timeDiffTable'
import { TimeDifferenceInfoOrError } from '../useTimeDiffCalculator'
import { useTimeDiffAggregation } from './useTimeDiffAggregation'

interface TimeDiffResultProps {
  result: TimeDifferenceInfoOrError[]
}

export const TimeDiffResult: FC<TimeDiffResultProps> = ({ result }) => {
  const totalTime = useMemo(() => useTimeDiffAggregation(result), [result])

  return (
    <section className="container mx-auto bg-gray-200 border-2 border-gray-400 border-opacity-50 rounded-lg p-4 sm:flex sm:justify-center">
      <TimeDiffTable timeDifferences={result} totalTime={totalTime} />
    </section>
  )
}
