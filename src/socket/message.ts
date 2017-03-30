/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-21 11:28:04
 * @version 1.0.0
 * @desc utils.ts
 */


import { parse, stringify } from 'querystring'
import { format } from '../shared/misc'
import { MessageEncodings, SenderErrors, MessageKinds, Message } from './types'
import { RichError, ERR_KIND_SOCKET } from '../shared/RichError'


/**
 * parse payload according to encoding
 * @param payload
 * @param encoding
 * @return {*}
 * @throws {Error}
 */
export function parsePayload(payload: Buffer, encoding: MessageEncodings): any {
  if (payload === void 0 || payload.byteLength === 0) {
    // empty payload is allowed
    return void 0
  }
  switch (encoding) {
    case MessageEncodings.Binary:
      // maybe should not create a new buffer
      // this could change the raw payload also
      return payload.slice()
    case MessageEncodings.String:
      return payload.toString('utf8')
    case MessageEncodings.Json:
      // this maybe throw error
      return JSON.parse(payload.toString('utf8'))
    case MessageEncodings.UrlEncoded:
      return parse(payload.toString('utf8'))
    case MessageEncodings.Base64:
      return Buffer.from(payload.toString('utf8'), 'base64')
    default:
      throw new Error(format('Unknown message encoding<%H>', encoding))
  }
}

function isBufferLike(data: any) {
  return data instanceof ArrayBuffer || ArrayBuffer.isView(data)
}

/**
 * stringify payload according to encoding
 * @param data
 * @param encoding
 * @return {Buffer}
 */
export function stringifyPayload(data: any, encoding: MessageEncodings): Buffer {
  if (data === void 0) {
    // empty payload is allowed
    return void 0
  }
  if (encoding === MessageEncodings.Base64) {
    // need to operate buffer
    if (isBufferLike(data)) {
      data = Buffer.from(data)
    }
    if (!Buffer.isBuffer(data)) {
      // force to string
      data = String(data)
    }
    return Buffer.from(data.toString('base64'))
  }
  if (Buffer.isBuffer(data)) {
    // return buffer directly
    return data
  }
  if (isBufferLike(data)) {
    // to buffer
    return Buffer.from(data)
  }
  switch (encoding) {
    case MessageEncodings.Json:
      // maybe throw error
      data = JSON.stringify(data)
      break
    case MessageEncodings.UrlEncoded:
      data = stringify(data)
      break
    case MessageEncodings.String:
    case MessageEncodings.Binary:
      // force to string
      // TODO support ReadableStream
      data = String(data)
      break
    default:
      throw new Error(format('Unknown message encoding<%H>', encoding))
  }
  return Buffer.from(data)
}

/**
 *
 * @param kind
 * @param encoding
 * @param result
 * @param id
 * @param action
 * @param payload
 * @param data
 * @param client - if client is void 0, will not write to header, else will write
 * @return {Buffer}
 * @throws {RichError}
 */
export function stringifyMessage(
  kind: MessageKinds,
  encoding: MessageEncodings,
  result = 0,
  id = 0,
  action = 0,
  payload?: Buffer,
  data?: any,
  client?: number,
) {
  const header = Buffer.allocUnsafe(client === void 0 ? 8 : 12)
  client === void 0 || header.writeUInt32BE(client, 0)
  const offset = client === void 0 ? 0 : 4
  header.writeUInt8(kind << 4 + encoding, offset)
  header.writeUInt8(+result, offset + 1)
  header.writeUInt16BE(+id, offset + 2)
  header.writeUInt32BE(+action, offset + 4)
  try {
    payload = payload || stringifyPayload(data, encoding)
  } catch (e) {
    throw new RichError(SenderErrors.StringifyPayload, ERR_KIND_SOCKET, void 0, {
      send: { client, kind, encoding, result, id, action, payload, data },
    }, e)
  }
  return payload === void 0 ? header : Buffer.concat([header, payload])
}

/**
 *
 * @param msg
 * @param withClient - if true, will parse client header, else will not
 * @return {Message} - if payload === void 0, means without body
 * else if data === void 0, means could not parse payload according to
 * encoding, else parse success
 * @throws {RichError}
 */
export function parseMessage(
  msg: Buffer,
  withClient = false,
): Message {
  if (!Buffer.isBuffer(msg)) {
    throw new RichError(
      SenderErrors.ParseMessage, ERR_KIND_SOCKET,
      'Received message is not a Buffer', { receive: msg },
    )
  }
  if (msg.byteLength < (withClient ? 12 : 8)) {
    throw new RichError(
      SenderErrors.ParseMessage, ERR_KIND_SOCKET,
      'Received message length is incorrect', { receive: msg },
    )
  }
  const client   = withClient ? msg.readUInt32BE(0) : void 0
  const offset   = withClient ? 4 : 0
  const first    = msg.readUInt8(offset)
  const kind     = first >> 4
  const encoding = first & 0x0F
  const result   = msg.readUInt8(offset + 1)
  const id       = msg.readUInt16BE(offset + 2)
  const action   = msg.readUInt32BE(offset + 4)
  const payload  = msg.byteLength > offset + 8 ? msg.slice(offset + 8) : void 0
  let data: any
  try {
    data = parsePayload(payload, encoding)
  } catch (e) {
    throw new RichError(
      SenderErrors.ParsePayload, ERR_KIND_SOCKET, void 0,
      { receive: msg, received: { client, kind, encoding, result, id, action, payload } },
      e,
    )
  }
  return { client, kind, encoding, result, id, action, payload, data }
}
