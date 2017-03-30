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

export interface ClientMeta {
  id: number; // socketId
  uid?: number;
  ws?: WebSocket;
  headers: SMap<string>;
  midPool: UniqueIdPool;
}

export abstract class Server extends Duplex {
  protected clientDict: NMap<ClientMeta> = createNMap<ClientMeta>()
  protected clientList: ClientMeta[]     = []
  protected uidDict: NMap<ClientMeta[]>  = createNMap<ClientMeta[]>()

  setUid(id: number, uid: number) {
    const client = this.clientDict[id]
    if (!client) { return false }
    if (client.uid !== void 0) { return client.uid === uid }
    client.uid = uid
    client.cs.push()
  }

  getMid(target: number) {
    return this.clientDict[target] ? this.clientDict[target].midPool.alloc() : 0
  }

  constructor(options: ServerOptions) { super(options) }

  protected addClient(id: number, headers: SMap<string>, ws?: WebSocket) {
    if (this.clientDict[id] && this.clientDict[id].ws && this.clientDict[id].ws !== ws) {
      this.closeRemote(id)
    }
    const midPool  = new UniqueIdPool(0, UINT16_MAX_VALUE, void 0, true)
    const instance = <ClientMeta>{ id, headers, ws, midPool }
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
