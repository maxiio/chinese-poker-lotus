/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 20:32:23
 * @version 1.0.0
 * @desc BrokerServer.ts
 */


import { ServerOptions, Server } from './Server'
import { parseMessage } from './utils'
import { MessageKinds, MessageResults, Message } from './types'
import WebSocket = require('ws')


export class BrokerServer extends Server {
  private ws: WebSocket

  readonly withClient = true

  getWs() { return this.ws }

  closeSelf() { this.ws.close() }

  closeRemote(id: number) {
    this.send({
      client : id,
      kind   : MessageKinds.CloseClient,
      result : MessageResults.Reserved,
      id     : 0,
      action : 0,
      payload: void 0,
    })
  }

  constructor(options: ServerOptions) {
    super(options)
    const { protocol, targetHost, targetPort } = options

    const ws = new WebSocket(`${protocol}://${targetHost}:${targetPort}/`)
    ws.on('message', (data: Buffer) => this.handleMessage(parseMessage(data, true)))
    this.ws = ws
  }

  protected handleMessage(msg: Message) {
    switch (msg.kind) {
      case MessageKinds.ClientConnected:
        const headers = JSON.parse(msg.payload.toString('utf8')).headers || {}
        this.addClient(msg.client, headers)
        break
      case MessageKinds.ClientClosed:
        this.delClient(msg.client)
        break
      default:
        super.handleMessage(msg)
    }
  }
}
