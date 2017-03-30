/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-29 16:32:28
 * @version 1.0.0
 * @desc RichError.ts
 */


export class RichError {
  readonly code: number
  readonly message: string
  readonly data: any
  readonly stack: string

  readonly name = 'RichError'

  get isRich() { return true }

  constructor(code = 0, message = 'Unknown', data?: any, native = new Error(message)) {
    this.code    = code
    this.message = message
    this.data    = data
    this.stack   = native.stack
  }

  toString() {
    return `RichError: ${this.message}\n${this.stack}`
  }

  toJSON() {
    return { code: this.code, message: this.message, data: this.data }
  }
}
