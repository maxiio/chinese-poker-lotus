/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 00:51:19
 * @version 1.0.0
 * @desc UniqueIdPool.ts
 */


import { UINT32_MAX_VALUE } from './constants'


export class UniqueIdPool {
  private pool: number[]
  private nextStart: number

  constructor(
    private start = 0,
    private max = UINT32_MAX_VALUE,
    private poolSize = 0x100,
    private loopUse = false,
  ) {
    this.pool      = []
    this.nextStart = start
    this.createPool()
  }

  private createPool() {
    if (this.nextStart > this.max) {
      if (!this.loopUse) {
        throw new Error('unique id expended!')
      }
      this.nextStart = this.start
    }
    const max = Math.min(this.max - this.nextStart, this.poolSize)
    for (let i = 0; i < max; i++) {
      this.pool.push(this.nextStart + i)
    }
    this.nextStart += max
  }

  alloc() {
    this.pool.length === 0 && this.createPool()
    return this.pool.shift()
  }

  free(id: number) {
    this.pool.indexOf(id) < 0 && this.nextStart > id && this.pool.push(id)
    return this
  }
}
