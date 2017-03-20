/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc types.ts
 */


export enum MessageKinds {
  ClientRequest   = 0x00,
  ServerResponse  = 0x01,
  ServerRequest   = 0x02,
  ClientResponse  = 0x03,

  ClientConnected = 0x10,
  ClientClosed    = 0x11,
  CloseClient     = 0x12,
}

export enum MessageResults {
  Reserved       = 0x00,
  Ok             = 0x01,
  Unknown        = 0x10,
  NotFoundTarget = 0x11,
  NotFoundAction = 0x12,
  WriteError     = 0x13,
  Timeout        = 0x14,
}

export interface Message {
  kind?: MessageKinds;
  result?: MessageResults;
  id?: number;
  actionId?: number;
  payload?: Buffer;
  error?: Error;
}

export interface BrokerMessage extends Message {
  clientId?: number;
}

export type ErrorFunc = (error: Error) => void

export type MessageFunc = (msg: BrokerMessage) => void

export type ActionFunc = (msg: BrokerMessage) => Promise<BrokerMessage>

