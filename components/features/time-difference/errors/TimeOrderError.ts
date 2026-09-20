import { TimeDifferenceError } from './index'

/**
 * Raised when one entry starts before the previous entry ended, which would
 * otherwise produce a negative pause that silently shrinks the total.
 */
export class TimeOrderError extends TimeDifferenceError {
  public readonly previousEnd: string
  public readonly currentStart: string

  constructor(previousEnd: string, currentStart: string) {
    super(
      `Entry starting at ${currentStart} begins before the previous entry ended at ${previousEnd}.`,
    )
    this.previousEnd = previousEnd
    this.currentStart = currentStart
  }
}
