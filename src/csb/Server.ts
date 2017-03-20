/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Server.ts
 */

import { createNMap, splice, NMap, noop } from '../shared/utils';
import { Duplex, DuplexOptions } from './Duplex';
import { Deferred } from '../shared/Deferred';
import {
  BrokerMessage,
  MessageKinds,
  Message,
  MessageResults,
  MessageFunc
} from './types';
import WebSocket = require('ws');


export interface ServerOptions extends DuplexOptions {
  id?: number;
}

export interface ClientInstance {
  id: number;
  ws?: WebSocket;
  headers: NMap<string>;
  requests: NMap<Deferred<BrokerMessage>>;
}


export abstract class Server extends Duplex {
  protected clientDict = createNMap<ClientInstance>()
  protected clientList = new Array<ClientInstance>(0)

  constructor(
    private options: ServerOptions,
  ) {
    super(options)
  }

  protected addClient(id: number, headers: NMap<string>, ws?: WebSocket) {
    const instance = <ClientInstance>{ id, headers, ws, requests: createNMap() }
    this.clientList.push(instance)
    this.clientDict[id] = instance
    this.emit('connect', instance)
    return this
  }

  protected delClient(id: number) {
    const instance = this.clientDict[id]
    if (!instance) { return this }
    delete this.clientDict[id]
    splice(this.clientList, instance)
    this.closeRemote(id)
    this.emit('close', instance)
    return this
  }

  protected handleMessage(data: Message, from: number) {
    switch (msg.kind) {
      case MessageKinds.ClientRequest:
        this.response(msg)
        break
      case MessageKinds.ClientResponse:
        this.clientDict[from]
        && this.clientDict[from].requests[msg.id]
        && this.clientDict[from].requests[msg.id].resolve(msg)
        break
      default:
        this.log.notice('received unknown kind<%H> of message<%d> from client<%s>',
          msg.kind,
          msg.id,
          from)
        break
    }
  }

  abstract serialize(msg: BrokerMessage): Buffer

  send(data: BrokerMessage, callback: MessageFunc = noop) {
    const client = this.clientDict[data.clientId]
    if (!client) {
      callback({ result: MessageResults.NotFoundTarget })
      return
    }
    client.ws.send(this.serialize(data), (err) => {
      if (err) {
        this.log.error('send kind<%H> of message<%d> to client<%d> error: %s',
          data.kind,
          data.id,
          data.clientId,
          err)
      } else {
        this.log.debug('sent kind<%H> of message<%d> to client<%d>',
          data.kind,
          data.id,
          data.clientId)
      }
      callback(err ? { result: MessageResults.WriteError } : void 0)
    })
  }

  request(msg: BrokerMessage) {
    msg.id   = msg.id || this.midPool.alloc()
    msg.kind = msg.kind || MessageKinds.ServerRequest
    const r  = Object.assign({}, msg, {
      kind   : MessageKinds.ClientResponse,
      payload: void 0,
    })
    const d  = new Deferred<BrokerMessage>(this.options.timeout, () => {
      r.result = MessageResults.Timeout
      d.reject(r)
    })
    this.send(msg, (err) => {
      if (err) {
        r.result = err.result
        d.reject(r)
      }
    })
    d.promise.then(() => {
      if (this.clientDict[msg.clientId]) {
        delete this.clientDict[msg.clientId].requests[msg.id]
      }
    }, () => {
      if (this.clientDict[msg.clientId]) {
        delete this.clientDict[msg.clientId].requests[msg.id]
      }
    })
    this.clientDict[msg.clientId] && this.clientDict[msg.clientId].requests[msg.id] = d
    return d
  }

  on(event: 'connect', callback: (client: ClientInstance) => void): this
  on(event: 'close', callback: (client: ClientInstance) => void): this
}