/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-29 16:32:28
 * @version 1.0.0
 * @desc RichError.ts
 */

export const ERR_KIND_SOCKET = 0x0001
export const ERR_KIND_MODEL  = 0x0002
export const ERR_KIND_POKER  = 0x0003


export class RichError {
  readonly code: number
  readonly message: string
  readonly data: any
  readonly stack: string

  readonly name = 'RichError'

  readonly kind: number

  get isRich() { return true }

  get isSocket() { return this.kind === ERR_KIND_SOCKET }

  get isModel() { return this.kind === ERR_KIND_MODEL }

  get isPoker() { return this.kind === ERR_KIND_POKER }

  constructor(
    code = 0,
    kind?: number,
    message = 'Unknown',
    data?: any,
    native = new Error(message),
  ) {
    this.code    = code
    this.message = message || native.message
    this.data    = data
    this.stack   = native.stack
    this.kind    = kind
  }

  is(code: number) { return this.code === code }

  toString() {
    return `RichError: ${this.message}\n${this.stack}`
  }

  toJSON() {
    return { code: this.code, message: this.message, data: this.data }
  }
}
