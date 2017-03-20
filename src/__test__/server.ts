/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-14 11:24:14
 * @version 1.0.0
 * @desc server.ts
 *
 * RESULT:
 *  An `UPGRADE` request will not emit a `request` event, and it is expected result!
 */


import { createServer, request } from 'http'
import WebSocket = require('ws')
const server = createServer((req, res) => {
  console.log('Req: method: %s, url: %s, protocol: %s',
    req.method,
    req.url,
    req.httpVersion)
  res.end('Request')
})

server.listen(3000, () => console.log('LISTENING: 3000'))

new WebSocket.Server({ server })

const req = new WebSocket('ws://127.0.0.1:3000/')
  .on('open', () => {
    console.log('OPEN', req.url)
  })
  .on('message', () => {
    console.log('MESSAGE')
  })
  .on('close', () => {
    console.log('CLOSE')
  })
  .on('error', (...args: any[]) => {
    console.error('Error:', args)
  })

request({
  path    : '/',
  hostname: 'localhost',
  port    : 3000,
  method  : 'GET',
}, (res) => {
  const data: any[] = []
  res.on('data', (chunk) => data.push(chunk))
  res.on('end', () => {
    console.log('Response:', Buffer.concat(data).toString('utf8'))
  })
}).end()
