/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Client.ts
 */


import { DuplexOptions, Duplex } from './Duplex'
import { UINT16_MAX_VALUE } from '../shared/constants'
import { UniqueIdPool } from '../shared/UniqueIdPool'
import WebSocket = require('ws')


export class Client extends Duplex {
  readonly ws: WebSocket
  readonly midPool = new UniqueIdPool(0, UINT16_MAX_VALUE, void 0, true)

  readonly withClient = false

  getWs() { return this.ws }

  getMid() { return this.midPool.alloc() }

  closeSelf() { this.ws.close() }

  closeRemote() { throw new Error('Client cannot close server!') }

  constructor(options: DuplexOptions) {
    super(options)
    const { protocol, targetHost, targetPort } = options

    const ws = new WebSocket(`${protocol}://${targetHost}:${targetPort}/`)
    ws.on('message', (data: Buffer) => this.handleMessage(data))
    this.ws = ws
  }
}
