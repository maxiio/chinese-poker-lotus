/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 12:08:58
 * @version 1.0.0
 * @desc SockError.ts
 */


import { SenderErrors, Message } from './types'


export class SockError {
  get name() { return 'SockError' }

  get isSockError() { return true }

  readonly message: string
  readonly code: number
  readonly response: Message
  readonly request: Message
  readonly sent: Buffer
  readonly received: Buffer|string
  readonly stack: string

  constructor(
    message: string,
    code?: number,
    received?: Message,
    raw?: Buffer|string,
    native?: Error,
    request?: Message,
    sent?: Buffer,
  ) {
    this.message = message ? message : native ? native.message : ''

    this.code = code === void 0 ? received ? received.result : SenderErrors.Unknown : code

    this.response = received
    this.received = raw
    this.stack    = native ? native.stack : new Error(message).stack

    this.request = request
    this.sent    = sent
  }

  toString() {
    return `SockError ${this.code}: ${this.message}`
  }
}
