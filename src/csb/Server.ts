/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Server.ts
 */

import { createNMap, splice, NMap } from '../shared/utils'
import { Duplex, DuplexOptions } from './Duplex'
import { MessageKinds } from './types'
import { UniqueIdPool } from '../shared/UniqueIdPool'
import { UINT16_MAX_VALUE } from '../shared/constants'
import WebSocket = require('ws')


export interface ServerOptions extends DuplexOptions {
  id?: number;
}

export interface ClientInstance {
  id: number;
  ws?: WebSocket;
  headers: NMap<string>;
  midPool: UniqueIdPool;
}


export abstract class Server extends Duplex {
  protected clientDict = createNMap<ClientInstance>()
  protected clientList = new Array<ClientInstance>(0)

  readonly requestKind  = MessageKinds.ServerRequest
  readonly responseKind = MessageKinds.ServerResponse

  readonly acceptRequestKind  = MessageKinds.ClientRequest
  readonly acceptResponseKind = MessageKinds.ClientResponse

  getMid(target: number) {
    return this.clientDict[target] ? this.clientDict[target].midPool.alloc() : 0
  }

  constructor(options: ServerOptions) { super(options) }

  protected addClient(id: number, headers: NMap<string>, ws?: WebSocket) {
    if (this.clientDict[id] && this.clientDict[id].ws && this.clientDict[id].ws !== ws) {
      this.delClient(id)
    }
    const midPool  = new UniqueIdPool(0, UINT16_MAX_VALUE, void 0, true)
    const instance = <ClientInstance>{ id, headers, ws, midPool }
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

  on(event: 'connect', callback: (client: ClientInstance) => void): this
  on(event: 'close', callback: (client: ClientInstance) => void): this
  on(event: string, callback: (...params: any[]) => void) {
    return super.on(event, callback)
  }
}
