/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-19 21:50:09
 * @version 1.0.0
 * @desc Duplex.ts
 */


import { NMap, createSMap, SMap } from '../shared/utils'
import { Deferred } from '../shared/Deferred'
import { EventEmitter } from 'events'
import { Log } from '../shared/Log'
import {
  Message,
  CsbAction,
  ErrorFunc,
  MessageEncodings,
  ActionFunc,
  ResponseOptions,
  MessageResults,
  MessageKinds,
  RequestOptions,
  RequestHolder
} from './types'
import { parsePayload, stringifyPayload, stringifyMessage } from './utils'
import WebSocket = require('ws')


export interface DuplexOptions {
  targetHost: string;
  targetPort: number;
  timeout: number;
  pingTimeout: number;
  protocol: string;
  log: Log
}

export abstract class Duplex extends EventEmitter {
  protected actions: NMap<CsbAction>
  protected requests: SMap<RequestHolder> = createSMap<RequestHolder>()
  readonly log: Log

  abstract readonly withClient: boolean

  abstract readonly requestKind: MessageKinds
  abstract readonly responseKind: MessageKinds

  abstract readonly acceptRequestKind: MessageKinds
  abstract readonly acceptResponseKind: MessageKinds

  abstract getWs(target: number): WebSocket

  abstract getMid(target: number): number

  abstract closeSelf(): void

  abstract closeRemote(id: number): void

  constructor(
    private options: DuplexOptions
  ) {
    super()
    this.log = options.log
  }

  addAction(action: number, encoding: MessageEncodings, handler: ActionFunc) {
    if (this.actions[action]) {
      throw new Error('Action is already used!')
    }
    this.actions[action] = { action, encoding, handler }
    return this
  }

  addActions(actions: NMap<CsbAction>) {
    for (const action in actions) {
      this.addAction(+action, actions[action].encoding, actions[action].handler)
    }
    return this
  }

  send(msg: Message, encoding?: MessageEncodings, callback?: ErrorFunc) {
    const ws = this.getWs(msg.client)
    if (!ws) {
      callback({ result: MessageResults.NotFoundTarget })
      return this
    }
    Buffer.isBuffer(msg.payload)
    || (msg.payload = stringifyPayload(msg.payload || msg.data, encoding))
    ws.send(stringifyMessage(msg, this.withClient), (err) => {
      if (err) {
        this.log.error('send kind<%H> of message<%d> to client<%s> error: %s',
          msg.kind,
          msg.id,
          msg.client,
          err)
        callback({ result: MessageResults.WriteError, raw: err })
      } else {
        this.log.debug('sent kind<%H> of message<%d> to client<%s>',
          msg.kind,
          msg.id,
          msg.client)
        callback({ result: MessageResults.Ok })
      }
    })
    return this
  }

  protected response(msg: Message) {
    const d: Deferred<ResponseOptions> = new Deferred<ResponseOptions>(
      this.options.timeout, () => d.reject({
        result: MessageResults.Timeout,
        data  : void 0,
      })
    )

    const action = this.actions[msg.action]
    if (action) {
      msg.data = parsePayload(msg.payload, action.encoding)
      d.resolve(action.handler(msg))
    } else {
      d.reject({
        result: MessageResults.NotFoundAction,
        data  : void 0,
      })
    }
    return d.promise.then((data: ResponseOptions) => ({
      result: data && data.result ? data.result : MessageResults.Ok,
      data  : data && data.data ? data.data : void 0,
    }), (err: ResponseOptions) => ({
      result: err && err.result ? err.result : MessageResults.Unknown,
      data  : err && err.data ? err.data : void 0,
    })).then((data: ResponseOptions) => this.send({
      client : msg.client,
      kind   : this.responseKind,
      result : data.result,
      id     : msg.id,
      action : msg.action,
      payload: void 0,
      data   : data.data,
    }, action ? action.encoding : void 0))
  }

  protected getMsgIdentifier(msg: Message) {
    return `${msg.client || 0}_${msg.id || 0}`
  }

  request(
    options: RequestOptions,
    encoding = MessageEncodings.Json,
    responseEncoding = encoding,
  ): Promise<Message> {
    const msg  = <Message>{
      client : options.to || 0,
      kind   : this.requestKind,
      result : MessageResults.Reserved,
      id     : options.id || this.getMid(options.to),
      action : options.action,
      payload: void 0,
      data   : options.data,
    }
    const id   = this.getMsgIdentifier(msg)
    const d    = new Deferred<Message>(this.options.timeout, () => {
      // timeout remove holder
      delete this.requests[id]
      d.reject(Object.assign({}, msg, {
        result : MessageResults.Timeout,
        payload: void 0,
      }))
    }) as RequestHolder
    d.encoding = responseEncoding
    this.send(msg, encoding, (err) => {
      if (err.result !== MessageResults.Ok) {
        d.reject(Object.assign({}, msg, err))
      }
    })
    d.promise.then(() => delete this.requests[id], () => delete this.requests[id])
    this.requests[id] = d
    return d.promise
  }

  protected handleMessage(msg: Message) {
    switch (msg.kind) {
      case this.acceptResponseKind:
        const id = this.getMsgIdentifier(msg)
        if (this.requests[id]) {
          // receive message delete holder
          // and clear timeout, if is not
          // timeout
          const holder = this.requests[id]
          delete this.requests[id]
          holder.clearTimeout()
          msg.data = parsePayload(msg.payload, holder.encoding)
          holder.resolve(msg)
        }
        break
      case this.acceptRequestKind:
        this.response(msg)
        break
      default:
        this.log.notice('received unknown message<%H> kind<%H>', msg.id, msg.kind)
        break
    }
  }
}
