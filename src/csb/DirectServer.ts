/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 20:32:23
 * @version 1.0.0
 * @desc DirectServer.ts
 */


import { Server, ServerOptions } from './Server';
import { BrokerMessage, MessageKinds, MessageResults } from './types';
import { UniqueIdPool } from '../shared/UniqueIdPool';
import { parseMessage, serializeMessage } from './message';
import { Deferred } from '../shared/Deferred';
import WebSocket = require('ws');


export class DirectServer extends Server {
  private server: WebSocket.Server
  private clientIdPool = new UniqueIdPool()

  constructor(
    private options: ServerOptions
  ) {
    super(options)
    const server = new WebSocket.Server({
      host: options.targetHost,
      port: options.targetPort,
    })
    server.on('connection', (ws) => {
      const id = this.clientIdPool.alloc()
      this.addClient(id, ws.upgradeReq.headers, ws)
      ws.on('close', () => this.delClient(id))
      ws.on('message', (data: Buffer) => this.handleMessage(parseMessage(data), id))
    })
    this.server = server
  }

  serialize(msg: BrokerMessage) {
    return serializeMessage(msg)
  }

  closeSelf() {
    this.server.close()
  }

  closeRemote(id: number) {
    this.clientDict[id] && this.clientDict[id].ws.close()
    this.delClient(id)
  }
}