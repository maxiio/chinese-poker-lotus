/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Broker.ts
 */

import WebSocket = require('ws');
import { createNMap, splice, random, noop, NMap } from '../shared/utils';
import { UniqueIdPool } from '../shared/UniqueIdPool';
import { MessageKinds, BrokerMessage, Message, ErrorFunc, MessageResults } from './types';
import {
  parseMessage,
  serializeMessage,
  serializeBrokerMessage,
  parseBrokerMessage
} from './message';
import { Deferred } from '../shared/Deferred';
import { Log } from '../shared/Log';
export interface BrokerOptions {
  serverHost: string;
  serverPort: number;
  serverIdField: string; // for client, this upgrade header specify target server, for
  // server, this field specify the server's id, if the id is used already, will close
  // it immediately
  clientHost: string;
  clientPort: number;
  responseTimeout: number;
}

export interface ServerInstance {
  id: number;
  ws: WebSocket;
  clients: number[];
  queues: NMap<NMap<Deferred<Message>>>;
}

export interface ClientInstance {
  id: number;
  ws: WebSocket;
  server: number;
  queue: NMap<Deferred<BrokerMessage>>;
}

export class Broker {
  private server: WebSocket.Server
  private client: WebSocket.Server
  private log = new Log('Broker')

  constructor(
    private options: BrokerOptions
  ) {
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

  private serverDict   = createNMap<ServerInstance>()
  private serverList   = new Array<ServerInstance>(0)
  private serverIdPool = new UniqueIdPool()

  private addServer(ws: WebSocket) {
    const id = +ws.upgradeReq.headers[this.options.serverIdField]
               || this.serverIdPool.alloc()
    if (this.serverDict[id]) {
      return ws.close(403, 'Id used already')
    }
    const instance = <ServerInstance>{ id, ws, clients: [], queues: createNMap() }
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

  private clientDict   = createNMap<ClientInstance>()
  private clientList   = new Array<ClientInstance>(0)
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
    server.queues[id] = createNMap()
    this.sendToServer(server.id, {
      kind   : MessageKinds.ClientConnected,
      payload: {
        headers: ws.upgradeReq.headers,
      },
    })
    const client = {
      id,
      ws,
      server: server.id,
      queue : createNMap<Deferred<BrokerMessage>>(),
    }
    ws.on('message', (data) => this.handleClientMessage(data, id))
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
    delete server.queues[id]
    splice(server.clients, id)
    this.sendToServer(server.id, { clientId: id, kind: MessageKinds.ClientClosed })
  }

  private sendToServer(id: number, msg: BrokerMessage, cb: ErrorFunc = noop) {
    const server = this.serverDict[id]
    if (!server) {
      cb(void 0)
      return
    }
    server.ws.send(serializeBrokerMessage(msg), (err) => {
      if (err) {
        this.log.error('send message<%s> from client<%s> to server<%s> error: %s',
          msg.id,
          msg.clientId,
          id,
          err)
      } else {
        this.log.debug('send message<%s> from client<%s> to server<%s>',
          msg.id,
          msg.clientId,
          id)
      }
      cb(err)
    })
  }

  private sendToClient(id: number, msg: Message, cb: ErrorFunc = noop) {
    const client = this.clientDict[id]
    if (!client) {
      cb(void 0)
      return
    }
    client.ws.send(serializeMessage(msg), (err) => {
      if (err) {
        this.log.error('send message<%s> to client<%s> error: %s', msg.id, id, err)
      } else {
        this.log.debug('send message<%s> to client<%s>', msg.id, id)
      }
      cb(err)
    })
  }

  private checkOutClient(msg: BrokerMessage) {
    const client = this.clientDict[msg.clientId]
    if (!client) { return }
    const defer = client.queue[msg.id]
    if (!defer) { return }
    delete client.queue[msg.id]
    defer.isTimeout || clearTimeout(defer.timer)
    if (msg.result === MessageResults.Ok) {
      defer.resolve(msg)
    } else {
      defer.reject(msg)
    }
  }

  private checkOutServer(msg: Message, from: number) {
    const client = this.clientDict[from]
    if (!client) { return }
    const server = this.serverDict[client.server]
    if (!server || !server.queues[from] || !server.queues[from][msg.id]) { return }
    const defer = server.queues[from][msg.id]
    delete server.queues[from][msg.id]
    defer.isTimeout || clearTimeout(defer.timer)
    if (msg.result === MessageResults.Ok) {
      defer.resolve(msg)
    } else {
      defer.reject(msg)
    }
  }

  private handleServerMessage(data: Buffer, from: number) {
    const server = this.serverDict[from]
    if (!server) { return }
    const msg = parseBrokerMessage(data)
    switch (msg.kind) {
      case MessageKinds.ServerRequest:
        const d = new Deferred<BrokerMessage>(this.options.responseTimeout, () => {
          this.checkOutServer(Object.assign({}, msg, {
            kind   : MessageKinds.ClientResponse,
            result : MessageResults.Timeout,
            payload: void 0,
          }), msg.clientId)
        })
        d.promise.catch((err) => {
          if (!err || !err.result) {
            err = <Message>{ result: MessageResults.Unknown, payload: void 0 }
          }
          return err
        }).then((data) => this.sendToServer(from, Object.assign({}, msg, data)))
        server.queues[msg.clientId][msg.id] = d
        break
      case MessageKinds.ServerResponse:
        this.checkOutClient(msg)
        break
      case MessageKinds.CloseClient:
        this.delClient(msg.clientId)
        break
      default:
        this.log.notice('received unknown kind<%s> message<%s> from server<%s>',
          msg.kind,
          msg.id,
          from)
        break
    }
  }

  private handleClientMessage(data: Buffer, from: number) {
    const client = this.clientDict[from]
    if (!client) { return }
    const msg = parseMessage(data)
    switch (msg.kind) {
      case MessageKinds.ClientRequest:
        const d = new Deferred<BrokerMessage>(this.options.responseTimeout, () => {
          this.checkOutClient(Object.assign({}, msg, {
            kind   : MessageKinds.ServerResponse,
            result : MessageResults.Timeout,
            payload: void 0,
          }))
        })
        d.promise.catch((err) => {
          if (!err || !err.result) {
            err = <BrokerMessage>{ result: MessageResults.Unknown, payload: void 0 }
          }
          return err
        }).then((data) => this.sendToClient(client.id, Object.assign({}, msg, data)))
        client.queue[msg.id] = d
        break
      case MessageKinds.ClientResponse:
        this.checkOutServer(msg, from)
        break
      default:
        this.log.notice('received unknown kind<%s> message<%s> from client<%s>',
          msg.kind,
          msg.id,
          from)
        break
    }
  }
}