import { TimeDifferenceError } from './index'

export class TimeParsingError extends TimeDifferenceError {
  public readonly parsedString: string

  constructor(message: string, parsedString: string) {
    super(message)
    this.parsedString = parsedString
  }
}
