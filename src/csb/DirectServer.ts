/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 20:32:23
 * @version 1.0.0
 * @desc DirectServer.ts
 */


import { Server, ServerOptions } from './Server'
import { UniqueIdPool } from '../shared/UniqueIdPool'
import WebSocket = require('ws')


export class DirectServer extends Server {
  private server: WebSocket.Server
  private clientIdPool = new UniqueIdPool()

  readonly withClient = false

  getWs(target: number) {
    return this.clientDict[target] ? this.clientDict[target].ws : void 0
  }

  closeSelf() { this.server.close() }

  closeRemote(id: number) {
    this.clientDict[id] && this.clientDict[id].ws.close()
    this.delClient(id)
  }

  constructor(options: ServerOptions) {
    super(options)
    const server = new WebSocket.Server({
      host: options.targetHost,
      port: options.targetPort,
    })
    server.on('connection', (ws) => {
      const id = this.clientIdPool.alloc()
      this.addClient(id, ws.upgradeReq.headers, ws)
      ws.on('close', () => this.delClient(id))
      ws.on('message', (data: Buffer) => this.handleMessage(data, id))
    })
    this.server = server
  }
}
