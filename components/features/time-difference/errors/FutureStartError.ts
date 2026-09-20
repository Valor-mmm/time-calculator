import { TimeDifferenceError } from './index'

/**
 * Raised for an entry with no end time whose start lies in the future, which
 * cannot describe something that is currently running.
 */
export class FutureStartError extends TimeDifferenceError {
  public readonly start: string

  constructor(start: string) {
    super(`Entry starting at ${start} has not started yet.`)
    this.start = start
  }
}
