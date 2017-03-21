/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc types.ts
 */


import { Deferred } from '../shared/Deferred'
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
  Ok             = 0x7F,
  Unknown        = 0x10,
  NotFoundTarget = 0x11,
  NotFoundAction = 0x12,
  WriteError     = 0x13,
  Timeout        = 0x14,
  ParseError     = 0x15,
}

export enum MessageEncodings {
  Binary     = 0,
  String     = 1,
  Json       = 2,
  UrlEncoded = 3,
  FormData   = 4,
}

export interface RequestOptions {
  id?: number;
  to?: number;
  action: number;
  data: any;
}

export interface ResponseOptions {
  result: MessageResults;
  data: any;
}

export interface Message {
  client?: number;
  kind: number;
  result: MessageResults;
  id: number;
  action: number;
  payload: Buffer;
  data?: any;
}

export interface CsbError {
  result: MessageResults;
  raw?: Error;
}

export type ErrorFunc = (error: CsbError) => void

export type ActionFunc = (msg: Message) => Promise<ResponseOptions>

export interface CsbAction {
  action?: number;
  encoding: MessageEncodings;
  handler: ActionFunc;
}

export interface RequestHolder extends Deferred<Message> {
  encoding?: MessageEncodings;
}
