/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 22:24:47
 * @version 1.0.0
 * @desc Deferred.ts
 */


import { noop } from './utils'
export class Deferred<T> {
  readonly resolve: (data: T|Promise<T>) => void
  readonly reject: (reason: any) => void
  readonly promise: Promise<T>
  readonly timeout: number
  readonly timeoutFunc: () => void
  readonly timer: number

  isTimeout: boolean

  clearTimeout() {
    this.isTimeout || clearTimeout(this.timer)
    return this
  }

  constructor(timeout?: number, timeoutFunc = noop) {
    this.promise     = new Promise<T>((resolve, reject) => {
      (<any>this).resolve = resolve;
      (<any>this).reject  = reject
    })
    this.isTimeout   = false
    this.timeout     = timeout
    this.timeoutFunc = timeoutFunc
    if (timeout) {
      this.timer = setTimeout(() => {
        this.isTimeout = true
        timeoutFunc()
      }, timeout) as any
    }
  }
}
