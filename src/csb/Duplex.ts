/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-19 21:50:09
 * @version 1.0.0
 * @desc Duplex.ts
 */


import {
  BrokerMessage,
  ActionFunc,
  MessageResults,
  MessageKinds,
  MessageFunc
} from './types';
import { NMap } from '../shared/utils';
import { Deferred } from '../shared/Deferred';
import { EventEmitter } from 'events';
import { Log } from '../shared/Log';
import { UniqueIdPool } from '../shared/UniqueIdPool';
import { UINT16_MAX_VALUE } from '../shared/constants';


export interface DuplexOptions {
  targetHost: string;
  targetPort: number;
  timeout: number;
  pingTimeout: number;
  protocol: string;
  log: Log
}

export abstract class Duplex extends EventEmitter {
  protected actions: NMap<ActionFunc>
  readonly midPool = new UniqueIdPool(0, UINT16_MAX_VALUE, 100, true)

  readonly log: Log

  constructor(
    private options: DuplexOptions
  ) {
    super()
    this.log = options.log
  }

  addAction(action: number, handler: ActionFunc) {
    if (this.actions[action]) {
      throw new Error('Action is already used!')
    }
    this.actions[action] = handler
    return this
  }

  addActionMap(actions: NMap<ActionFunc>) {
    for (const action of actions) {
      this.addAction(action, actions[action])
    }
    return this
  }

  abstract send(msg: BrokerMessage, callback: MessageFunc): void

  protected response(msg: BrokerMessage) {
    const resp: BrokerMessage = Object.assign({}, msg, {
      kind   : msg.kind === MessageKinds.ClientRequest
        ? MessageKinds.ServerResponse
        : MessageKinds.ClientResponse,
      payload: void 0,
    })

    const d = new Deferred<BrokerMessage>(this.options.timeout, () => {
      resp.result = MessageResults.Timeout
      d.reject(resp)
    })
    if (!this.actions[msg.actionId]) {
      resp.result = MessageResults.NotFoundAction
      d.reject(resp)
    } else {
      d.resolve(this.actions[msg.actionId](msg))
    }
    return d.promise.catch((err: BrokerMessage) => {
      if (!err || !err.result) {
        resp.result = MessageResults.Unknown
        return resp
      }
      return err
    }).then((data) => this.send(data))
  }

  abstract request(msg: BrokerMessage): Promise<BrokerMessage>

  abstract closeSelf(): void

  abstract closeRemote(id: number): void
}