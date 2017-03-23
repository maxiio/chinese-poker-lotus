/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-19 21:50:09
 * @version 1.0.0
 * @desc Duplex.ts
 */


import { Log } from '../shared/Log'
import { EventEmitter } from 'events'
import {
  ActionFunc,
  Message,
  ReservedResults,
  MessageKinds,
  MessageEncodings,
  SenderErrors,
  Responser
} from './types'
import { NMap, createSMap, SMap } from '../shared/utils'
import { Deferred } from '../shared/Deferred'
import { stringifyMessage, parseMessage } from './utils'
import { SockError } from './SockError'
import WebSocket = require('ws')


class SockResponser implements Responser {
  readonly request: Message
  readonly from: number
  private timer: number
  private _timeout: number
  get timeout() { return this._timeout }

  private _isTimeout: boolean
  get isTimeout() { return this._isTimeout }

  private _isSent: boolean
  get isSent() { return this._isSent }

  private _result: number
  get result() { return this._result }

  setResult(result: number) {
    if (this._isSent) { return this }
    this._result = result
    return this
  }

  setTimeout(timeout: number) {
    if (this._isSent) { return this }
    this._timeout = timeout
    this.timer && clearTimeout(this.timer)
    timeout > 0 && (this.timer = setTimeout(() => {
      this._isTimeout = true
      this.setResult(ReservedResults.Timeout).send()
    }, timeout) as any)
    return this
  }

  private worker: Duplex

  constructor(request: Message, timeout: number, from: number, worker: Duplex) {
    this.request = request
    this.from    = from
    this.worker  = worker
    this._result = ReservedResults.Ok
    this.setTimeout(timeout)
  }

  send(data?: any, encoding?: MessageEncodings): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._isSent || this._isTimeout) {
        reject(new SockError(
          'Cannot re-send response when the message is sent or is timeout',
          SenderErrors.RepeatSend, void 0, void 0, void 0, void 0, void 0,
        ))
        return
      }
      this.worker.send({
        client  : this.worker.withClient ? this.from : void 0,
        kind    : MessageKinds.Response,
        encoding: encoding,
        result  : this._result,
        id      : this.request.id,
        action  : this.request.action,
        payload : void 0,
        data    : data,
      }, this.from, (err) => {
        if (err) {
          reject(err)
        } else {
          this._isSent = true
          resolve(void 0)
        }
      })
    })
  }
}

export interface DuplexOptions {
  targetHost: string;   // the host to connect or listen
  targetPort: number;   // the port to connect or listen
  timeout: number;      // action handle timeout and wait for response timeout
  pingTimeout: number;  // ping timeout
  protocol: string;     // protocol, ws or wss, TODO
  log: Log;             // the logger
}


export abstract class Duplex extends EventEmitter {
  // registered actions
  protected actions: NMap<ActionFunc>
  // request timers
  protected requests: SMap<Deferred<Message>> = createSMap<Deferred<Message>>()
  // logger
  readonly log: Log
  // the message header contains client id or not
  // only for broker server
  abstract readonly withClient: boolean

  // get socket by target id
  abstract getWs(target: number): WebSocket

  // get next message id
  abstract getMid(target: number): number

  // close self
  abstract closeSelf(): void

  // close remote, only for server
  abstract closeRemote(id: number): void

  constructor(
    private options: DuplexOptions
  ) {
    super()
    this.log = options.log
  }

  /**
   * @param id - A action id length is 32 bit, we can use the first 16 bit as module id
   * and use the remains 16 bit as action id for specified module, for split project to
   * multiple modules.
   * @param action
   * @return {Duplex}
   */
  addAction(id: number, action: ActionFunc) {
    if (this.actions[id]) {
      throw new Error('Action is already used!')
    }
    this.actions[id] = action
    return this
  }

  addActions(actions: NMap<ActionFunc>) {
    for (const id in actions) {
      this.addAction(+id, actions[id])
    }
    return this
  }

  /**
   * send a message to target socket
   * @param msg - the message to send
   * @param target - the target socket id
   * @param callback - callback
   */
  send(msg: Message, target?: number, callback?: (err: SockError) => void) {
    let data: Buffer
    try {
      data = stringifyMessage(msg.kind,
        msg.encoding,
        msg.result,
        msg.id,
        msg.action,
        msg.payload,
        msg.data,
        this.withClient ? msg.client || 0 : void 0)
    } catch (e) {
      callback(e)
      return void 0
    }
    const ws = this.getWs(target)
    if (!ws) {
      callback(new SockError('Not found target socket!', SenderErrors.NotFoundTarget, void 0, void 0, void 0, msg, data))
      return data
    }
    ws.send(msg, (err) => {
      if (err) {
        this.log.error('send kind<%H> of message<%d> to socket<%d> error: %s',
          msg.kind,
          msg.id,
          target,
          err)
      } else {
        this.log.debug('sent kind<%H> of message<%d> to socket<%d>',
          msg.kind,
          msg.id,
          target)
      }
      callback(new SockError('Socket write error', SenderErrors.WriteError, void 0, void 0, err, msg, data))
    })
    return data
  }

  protected getMsgIdentifier(client: number, id: number) {
    return `${client || 0}_${id || 0}`
  }

  /**
   * @param msg
   * @param target
   * @param hold - if not hold, will not wait for the target response, and resolve
   *      immediately when socket write success, else will wait for it until timeout.
   * @return {Promise<Message>}
   */
  request(msg: Message, target?: number, hold = true): Promise<Message> {
    // prepare request message
    msg.client = this.withClient ? target : void 0
    msg.kind   = MessageKinds.Request
    msg.encoding === void 0 && (msg.encoding = MessageEncodings.Json)
    msg.result = ReservedResults.Ok
    msg.id === void 0 && (msg.id = this.getMid(target))

    // local variables
    const qid = this.getMsgIdentifier(target, msg.id)
    let sent: Buffer
    let holder: Deferred<Message>

    // holder
    holder = new Deferred<Message>(this.options.timeout, () => {
      holder.reject(new SockError('Request timeout', SenderErrors.RequestTimeout, void 0, void 0, void 0, msg, sent))
    })

    if (hold) {
      this.requests[qid] = holder
      // clear holder
      holder.promise.then(
        () => delete this.requests[qid],
        () => delete this.requests[qid],
      )
    }
    // do request
    this.send(msg, target, (err) => {
      err ? holder.reject(err) : hold ? void 0 : holder.resolve(void 0)
    })

    return holder.promise
  }

  protected response(msg: Message, from: number) {
    const man    = new SockResponser(msg, this.options.timeout, from, this)
    const action = this.actions[msg.action]
    if (!action) {
      man.setResult(ReservedResults.NotFound).send()
      return
    }
    action(man)
    return <Responser>man
  }

  protected handleMessage(data: Buffer, from?: number) {
    let msg: Message
    try {
      msg = parseMessage(data, this.withClient)
    } catch (e) {
      if (e && e.isSockError && e.code === SenderErrors.ParsePayload) {
        this.send({
          client  : from,
          kind    : MessageKinds.Response,
          encoding: MessageEncodings.Binary,
          result  : ReservedResults.EncodingError,
          id      : e.request.id,
          action  : e.request.action,
          payload : void 0,
        }, from)
      }
      this.log.notice('parse incoming message emit unknown error<%s> with<%s>', e,
        Buffer.isBuffer(data)
          ? data.slice(0, 12).toJSON().data.map((x) => x.toString(16)).join(',')
          : data)
      return
    }
    this.routeMessage(msg, from)
  }

  protected routeMessage(msg: Message, from?: number) {
    from === void 0 && this.withClient && (from = msg.client)
    switch (msg.kind) {
      case MessageKinds.Response:
        const qid = this.getMsgIdentifier(from, msg.id)
        if (this.requests[qid]) {
          const holder = this.requests[qid]
          delete this.requests[qid]
          holder.clearTimeout().resolve(msg)
        }
        // omit response if there is no request queue for it
        break
      case MessageKinds.Request:
        this.response(msg, from)
        break
      default:
        this.log.notice('received unknown kind<%H> of message<%H> from<%H>',
          msg.kind,
          msg.id,
          from)
        break
    }
  }
}

