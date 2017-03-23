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
import { MessageKinds, ReservedResults, Message, MessageEncodings } from './types'
import WebSocket = require('ws')


export class BrokerServer extends Server {
  private ws: WebSocket

  readonly withClient = true

  getWs() { return this.ws }

  closeSelf() { this.ws.close() }

  closeRemote(id: number) {
    this.delClient(id)
    this.send({
      client  : id,
      kind    : MessageKinds.Close,
      encoding: MessageEncodings.Binary,
      result  : ReservedResults.Ok,
      id      : 0,
      action  : 0,
      payload : void 0,
    })
  }

  constructor(options: ServerOptions) {
    super(options)
    const { protocol, targetHost, targetPort } = options

    const ws = new WebSocket(`${protocol}://${targetHost}:${targetPort}/`)
    ws.on('message', (data: Buffer) => this.handleMessage(data))
    this.ws = ws
  }

  protected routeMessage(msg: Message) {
    switch (msg.kind) {
      case MessageKinds.Connected:
        this.addClient(msg.client, msg.data ? msg.data.headers : {})
        break
      case MessageKinds.Closed:
        this.delClient(msg.client)
        break
      default:
        super.routeMessage(msg, msg.client)
        break
    }
  }
}
