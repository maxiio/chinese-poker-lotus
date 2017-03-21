/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-21 11:28:04
 * @version 1.0.0
 * @desc utils.ts
 */


import { Message, MessageEncodings } from './types'
import { parse, stringify } from 'querystring'


export function parsePayload(data: Buffer, encoding: MessageEncodings): any {
  if (!data) { return data }
  switch (encoding) {
    case MessageEncodings.String:
      return data.toString('utf8')
    case MessageEncodings.Json:
      const str = data.toString('utf8')
      if (!str) { return str }
      try {
        return JSON.parse(str)
      } catch (_e) {
        return void 0
      }
    case MessageEncodings.UrlEncoded:
      return parse(data.toString('utf8'))
    default:
      return data
  }
}

function isBufferLike(data: any) {
  return data instanceof ArrayBuffer || ArrayBuffer.isView(data)
}

export function stringifyPayload(data: any, encoding?: MessageEncodings): Buffer {
  if (Buffer.isBuffer(data)) { return data }
  if (isBufferLike(data)) { return Buffer.from(data) }
  if (!data) { return void 0 }
  switch (encoding) {
    case MessageEncodings.Json:
      data = JSON.stringify(data)
      break
    case MessageEncodings.UrlEncoded:
      data = stringify(data)
      break
    default:
      data = String(data)
      break
  }
  return Buffer.from(data)
}

export function stringifyMessage(
  msg: Message,
  withClient = false,
) {
  const header = new Buffer(withClient ? 12 : 8)
  withClient && header.writeUInt32BE(msg.client || 0, 0)
  const offset = withClient ? 4 : 0
  header.writeUInt8(msg.kind || 0, offset)
  header.writeUInt8(msg.result || 0, offset + 1)
  header.writeUInt16BE(msg.id || 0, offset + 2)
  header.writeUInt32BE(msg.action || 0, offset + 4)
  return msg.payload ? Buffer.concat([header, msg.payload]) : header
}

export function parseMessage(data: Buffer, withClient = false): Message {
  const client  = withClient ? data.readUInt32BE(0) : void 0
  const offset  = withClient ? 4 : 0
  const kind    = data.readUInt8(offset)
  const result  = data.readUInt8(offset + 1)
  const id      = data.readUInt16BE(offset + 2)
  const action  = data.readUInt32BE(offset + 4)
  const payload = data.slice(offset + 8)
  return { client, kind, result, id, action, payload }
}
