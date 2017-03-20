/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc Client.ts
 */


import { DuplexOptions, Duplex } from './Duplex';
import {
  BrokerMessage,
  MessageKinds,
  Message,
  MessageResults,
  MessageFunc
} from './types';
import { parseMessage, serializeMessage } from './message';
import { createNMap, noop } from '../shared/utils';
import { Deferred } from '../shared/Deferred';
import WebSocket = require('ws');


export class Client extends Duplex {
  readonly ws: WebSocket
  private requests = createNMap<Deferred<Message>>()

  constructor(
    private options: DuplexOptions
  ) {
    super(options)
    const { protocol, targetHost, targetPort } = options

    const ws = new WebSocket(`${protocol}://${targetHost}:${targetPort}/`)
    ws.on('message', (data: Buffer) => this.handleMessage(data))
    this.ws = ws
  }

  send(data: BrokerMessage, callback: MessageFunc = noop) {
    this.ws.send(serializeMessage(data), (err) => {
      if (err) {
        this.log.error('send kind<%s> of message<%s> error: %s', data.kind, data.id, err)
      } else {
        this.log.debug('sent kind<%s> of message<%s>', data.kind, data.id)
      }
      callback(err ? { result: MessageResults.WriteError } : void 0)
    })
  }

  private handleMessage(data: Buffer) {
    const msg = parseMessage(data)
    switch (msg.kind) {
      case MessageKinds.ServerResponse:
        this.requests[msg.id]
        && this.requests[msg.id].resolve(msg)
        break
      case MessageKinds.ServerRequest:
        this.response(msg)
        break
      default:
        this.log.notice('received unknown message<%H> kind<%H>', msg.id, msg.kind)
        break
    }
  }

  request(msg: BrokerMessage) {
    msg.id  = msg.id || this.midPool.alloc()
    const r = Object.assign({}, msg, {
      kind   : MessageKinds.ServerRequest,
      payload: void 0,
    })
    const d = new Deferred<Message>(this.options.timeout, () => {
      r.result = MessageResults.Timeout
      d.reject(r)
    })
    this.send(msg, (err) => {
      if (err) {
        r.result = err.result
        d.reject(err)
      }
    })
    d.promise.then(() => {
      delete this.requests[msg.id]
    }, () => {
      delete this.requests[msd.id]
    })
    this.requests[msg.id] = d
    return d.promise
  }

  closeSelf() {
    this.ws.close()
  }

  closeRemote() {
    throw new Error('Client cannot close server!')
  }
}