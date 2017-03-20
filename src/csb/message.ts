/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 00:37:46
 * @version 1.0.0
 * @desc message.ts
 */


import { Message, MessageKinds, MessageResults, BrokerMessage } from './types';
function isBufferLike(payload: any) {
  return typeof payload === 'string'
         || payload instanceof ArrayBuffer
         || ArrayBuffer.isView(payload)
}

function serialize(payload: any) {
  return payload === void 0
    ? Buffer.alloc(0)
    : Buffer.isBuffer(payload)
           ? payload
           : Buffer.from(isBufferLike(payload) ? payload : JSON.stringify(payload))
}


export function parseMessage(data: Buffer): Message {
  const kind     = data.readUInt8()
  const result   = data.readUInt8(1)
  const id       = data.readUInt16BE(2)
  const actionId = data.readUInt32BE(4)
  const payload  = data.slice(8)
  return { kind, result, id, actionId, payload }
}

export function buildMessage(
  kind: MessageKinds|Message,
  result = MessageResults.Reserved,
  id = 0,
  actionId = 0,
  payload?: any,
): Buffer {
  const header = Buffer.alloc(8)
  header.writeUInt8(kind)
  header.writeUInt8(result, 1)
  header.writeUInt16BE(id, 2)
  header.writeUInt32BE(actionId, 4)
  return Buffer.concat([header, serialize(payload)])
}

export function serializeMessage(msg: Message) {
  return buildMessage(msg.kind, msg.result, msg.id, msg.actionId, msg.payload)
}

export function parseBrokerMessage(data: Buffer): BrokerMessage {
  const clientId = data.readUInt32BE()
  const kind     = data.readUInt8(4)
  const result   = data.readUInt8(5)
  const id       = data.readUInt16BE(6)
  const actionId = data.readUInt32BE(8)
  const payload  = data.slice(12)
  return { clientId, kind, result, id, actionId, payload }
}

export function buildBrokerMessage(
  clientId: number,
  kind: MessageKinds,
  result = MessageResults.Reserved,
  id = 0,
  actionId = 0,
  payload?: any,
): Buffer {
  const header = Buffer.alloc(12)
  header.writeUInt8(clientId)
  header.writeUInt8(kind, 4)
  header.writeUInt8(result, 5)
  header.writeUInt16BE(id, 6)
  header.writeUInt32BE(actionId, 8)
  return Buffer.concat([header, serialize(payload)])
}

export function serializeBrokerMessage(msg: BrokerMessage) {
  return buildBrokerMessage(msg.clientId,
    msg.kind,
    msg.result,
    msg.id,
    msg.actionId,
    msg.payload)
}