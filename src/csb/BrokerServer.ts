/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 20:32:23
 * @version 1.0.0
 * @desc BrokerServer.ts
 */


import { ServerOptions, Server } from './Server';
import { parseBrokerMessage, serializeBrokerMessage } from './message';
import { MessageKinds, Message } from './types';
import WebSocket = require('ws');


export class BrokerServer extends Server {
  private ws: WebSocket

  constructor(
    private options: ServerOptions
  ) {
    super(options)
    const { protocol, targetHost, targetPort } = options

    const ws = new WebSocket(`${protocol}://${targetHost}:${targetPort}/`)
    ws.on('message', (data: Buffer) => this.handleMessage(parseBrokerMessage(data)))
    this.ws = ws
  }

  protected handleMessage(msg: Message) {
    switch (msg.kind) {
      case MessageKinds.ClientConnected:
        const headers = JSON.parse(msg.payload.toString('utf8')).headers || {}
        this.addClient(msg.clientId, headers)
        break
      case MessageKinds.ClientClosed:
        this.delClient(msg.clientId)
        break
      default:
        super.handleMessage(msg, from)
    }
  }

  serialize(msg: BrokerServer) {
    return serializeBrokerMessage(msg)
  }

  closeSelf() {
    this.ws.close()
  }

  closeRemote(id: number) {
    this.send({ clientId: id, kind: MessageKinds.CloseClient })
    this.delClient(id)
  }
}