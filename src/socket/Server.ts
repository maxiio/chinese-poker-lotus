/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Server.ts
 */

import { createNMap, splice, SMap, NMap } from '../shared/misc'
import { Duplex, DuplexOptions } from './Duplex'
import { UniqueIdPool } from '../shared/UniqueIdPool'
import { UINT16_MAX_VALUE } from '../shared/constants'
import WebSocket = require('ws')


export interface ServerOptions extends DuplexOptions {
  id?: number;
}

export interface ClientInstance {
  id: number;
  ws?: WebSocket;
  headers: SMap<string>;
  midPool: UniqueIdPool;
}

export abstract class Server extends Duplex {
  protected clientDict: NMap<ClientInstance> = createNMap<ClientInstance>()
  protected clientList: ClientInstance[]     = []

  getMid(target: number) {
    return this.clientDict[target] ? this.clientDict[target].midPool.alloc() : 0
  }

  constructor(options: ServerOptions) { super(options) }

  protected addClient(id: number, headers: SMap<string>, ws?: WebSocket) {
    if (this.clientDict[id] && this.clientDict[id].ws && this.clientDict[id].ws !== ws) {
      this.closeRemote(id)
    }
    const midPool  = new UniqueIdPool(0, UINT16_MAX_VALUE, void 0, true)
    const instance = <ClientInstance>{ id, headers, ws, midPool }
    this.clientList.push(instance)
    this.clientDict[id] = instance
    this.emit('connect', instance)
    this.log.log('new connection<%H> from IP:%s',
      id,
      ws ? ws.upgradeReq.connection.remoteAddress : '0.0.0.0')
    return this
  }

  protected delClient(id: number) {
    const instance = this.clientDict[id]
    if (!instance) { return this }
    delete this.clientDict[id]
    splice(this.clientList, instance)
    this.emit('close', instance)
    this.log.log('connection<%H> from IP:%s closed',
      instance.id,
      instance.ws ? instance.ws.upgradeReq.connection.remoteAddress : '0.0.0.0')
    return this
  }
}
