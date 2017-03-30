/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-17 23:40:36
 * @version 1.0.0
 * @desc types.ts
 */

// message kinds
export enum MessageKinds {
  Request   = 0x1,
  Response  = 0x2,

  Connected = 0xD,
  Closed    = 0xE,
  Close     = 0xF,
}

export enum MessageEncodings {
  Binary     = 0,
  String     = 1,
  Json       = 2,
  UrlEncoded = 3,
  Base64     = 4,
}

export enum ReservedResults {
  Ok              = 0x00, // OK and reserved for other message kinds

  NotFound        = 0xC9, // no action to handle this request
  Timeout         = 0xCA, // action handle timeout
  EncodingError   = 0xCB, // could not parse payload according to encoding
  BadRequest      = 0xCC, // payload is incorrect
  Unauthorized    = 0xCD, // need to login
  Forbidden       = 0xCE, // forbid to access this action
  TooManyRequests = 0xCF, // too many request
  InternalError   = 0xD0, // action throws error
  PayloadTooLarge = 0xD1, // payload too large
  NotImplemented  = 0xD2,
}

// common message structure
export interface Message {
  client?: number; // target client, just for server and broker
  encoding?: MessageEncodings;
  kind?: number; // message kind
  result?: number; // result for response kind
  id?: number; // message id
  action?: number; // target action
  payload?: Buffer; // raw payload
  data?: any;
}

export interface Responser {
  readonly request: Message;
  readonly timeout: number;
  readonly isTimeout: boolean;
  readonly isSent: boolean;
  readonly result: number;
  readonly from: number;
  setResult(result: number): this;
  setTimeout(timeout: number): this;
  send(data?: any, encoding?: MessageEncodings): Promise<void>;
}

// signature of action function
export type ActionFunc = (man: Responser) => void

export enum SenderErrors {
  NotFoundTarget   = 0x100,
  WriteError       = 0x102,
  Unknown          = 0x103,
  ParseMessage     = 0x104,
  ParsePayload     = 0x105,
  StringifyPayload = 0x106,
  RequestTimeout   = 0x107,
  RepeatSend       = 0x108,
}
