/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Broker.ts
 */


import WebSocket = require('ws')
import { Log } from '../shared/Log'
import { UniqueIdPool } from '../shared/UniqueIdPool'
import { createNMap, splice, random } from '../shared/utils'
import { stringifyMessage } from './utils'
import { MessageKinds, ReservedResults, Message } from './types'


export interface BrokerOptions {
  serverHost: string;
  serverPort: number;
  serverIdField: string;  // for client, this upgrade header specify target server, for
                          // server, this field specify the server's id, if the id is
                          // used already, will close it immediately
  clientHost: string;
  clientPort: number;
  pingTimeout: number;

  log: Log;
}

export interface BrokerServerMeta {
  id: number;
  ws: WebSocket;
  clients: number[];
}

export interface BrokerClientMeta {
  id: number;
  ws: WebSocket;
  server: number;
}

export class Broker {
  private server: WebSocket.Server
  private client: WebSocket.Server

  private log: Log

  constructor(
    private options: BrokerOptions,
  ) {
    this.log     = options.log
    const server = new WebSocket.Server({
      host: options.serverHost,
      port: options.serverPort,
    })
    const client = new WebSocket.Server({
      host: options.clientHost,
      port: options.clientPort,
    })
    server.on('connection', (ws) => this.addServer(ws))
    client.on('connection', (ws) => this.addClient(ws))
    this.server = server
    this.client = client
  }

  private serverDict   = createNMap<BrokerServerMeta>()
  private serverList   = new Array<BrokerServerMeta>(0)
  private serverIdPool = new UniqueIdPool()

  private addServer(ws: WebSocket) {
    const id = +ws.upgradeReq.headers[this.options.serverIdField]
               || this.serverIdPool.alloc()
    if (this.serverDict[id]) {
      return ws.close(403, 'Id used already')
    }
    const instance = <BrokerServerMeta>{ id, ws, clients: [] }
    ws.on('message', (data) => this.handleServerMessage(data, id))
    ws.on('close', () => this.delServer(id))
    this.serverDict[id] = instance
    this.serverList.push(instance)
  }

  private delServer(id: number) {
    const server = this.serverDict[id]
    if (!server) { return }
    delete this.serverDict[id]
    splice(this.serverList, server)
    this.serverIdPool.free(id)
    server.ws.close()
    for (let i = 0; i < server.clients.length; i++) {
      this.delClient(server.clients[i])
    }
  }

  private clientDict   = createNMap<BrokerClientMeta>()
  private clientList   = new Array<BrokerClientMeta>(0)
  private clientIdPool = new UniqueIdPool()

  private addClient(ws: WebSocket) {
    const id     = this.clientIdPool.alloc()
    const server = this.serverDict[+ws.upgradeReq.headers[this.options.serverIdField]]
                   || this.serverList[random(0, this.serverList.length - 1)]
    if (!server) {
      ws.close(404, 'No server is available')
      return
    }
    server.clients.push(id)
    this.sendToServer(server.id, {
      client : id,
      kind   : MessageKinds.Connected,
      result : ReservedResults.Ok,
      id     : 0,
      action : 0,
      payload: void 0,
      data   : { headers: ws.upgradeReq.headers },
    })
    const client = { id, ws, server: server.id }
    ws.on('message', (data: Buffer) => this.handleClientMessage(data, id))
    ws.on('close', () => this.delClient(id))
    this.clientDict[id] = client
    this.clientList.push(client)
  }

  private delClient(id: number) {
    const client = this.clientDict[id]
    if (!client) {
      return
    }
    delete this.clientDict[id]
    splice(this.clientList, client)
    this.clientIdPool.free(id)
    client.ws.close()
    const server = this.serverDict[client.server]
    if (!server) {
      return
    }
    splice(server.clients, id)
    this.sendToServer(server.id, {
      client : id,
      kind   : MessageKinds.Closed,
      result : ReservedResults.Ok,
      id     : 0,
      action : 0,
      payload: void 0,
    })
  }

  // 1. write client message to server
  //    need to add extra header fields to message
  // 2. send client connect information to server
  //    need to serialize message
  private sendToServer(id: number, msg: Message|Buffer, from?: number) {
    const server = this.serverDict[id]
    if (!server) { return }
    let data: Buffer
    if (!Buffer.isBuffer(msg)) {
      data =
        stringifyMessage(msg.kind,
          msg.encoding,
          msg.result,
          msg.id,
          msg.action,
          msg.payload,
          msg.data,
          msg.client || from || 0)
    } else {
      const head = Buffer.alloc(4)
      head.writeUInt32BE(from, 0)
      data = Buffer.concat([head, msg])
    }
    server.ws.send(data, (err) => {
      if (err) {
        this.log.error(
          'send kind<%H> of message<%d> from client<%d> to server<%d> error: %s',
          data.readUInt8(4), data.readUInt16BE(6), data.readUInt32BE(0), id, err,
        )
      } else {
        this.log.debug(
          'sent kind<%H> of message<%d> from client<%d> to server<%d>',
          data.readUInt8(4), data.readUInt16BE(6), data.readUInt32BE(0), id,
        )
      }
    })
  }

  // write server message to client
  // need to remove extra header fields from message
  private sendToClient(data: Buffer, from: number) {
    const id     = data.readUInt32BE(4)
    const client = this.clientDict[id]
    if (!client) { return }
    client.ws.send(data.slice(4), (err) => {
      if (err) {
        this.log.error(
          'send kind<%H> of message<%d> from server<%d> to client<%d> error: %s',
          data.readUInt8(4), data.readUInt16BE(6), from, id, err,
        )
      } else {
        this.log.debug(
          'sent kind<%H> of message<%d> from server<%d> to client<%d>',
          data.readUInt8(4), data.readUInt16BE(6), from, id,
        )
      }
    })
  }

  private handleServerMessage(data: Buffer, from: number) {
    if (!Buffer.isBuffer(data) || data.byteLength < 12) { return }
    const client = data.readUInt32BE(0)
    const kind   = data.readUInt8(4) >> 4
    switch (kind) {
      case MessageKinds.Close:
        this.delClient(client)
        break
      default:
        this.sendToClient(data, from)
        break
    }
  }

  private handleClientMessage(data: Buffer, from: number) {
    if (!Buffer.isBuffer(data) || data.byteLength < 8) { return }
    const client = this.clientDict[from]
    if (!client) { return }
    this.sendToServer(client.server, data, from)
  }
}
