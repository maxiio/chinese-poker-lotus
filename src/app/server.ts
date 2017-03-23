/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:50:39
 * @version 1.0.0
 * @desc server.ts
 */


import { DirectServer } from '../csb/DirectServer'
import { Log } from '../shared/Log'
import { Pusher } from '../csb/Pusher'
import { NMap, SMap } from '../shared/utils'
import { ActionFunc } from '../csb/types'
import { modules } from './modules'

const log = Log.get('AS') // Access server

const server = new DirectServer({
  targetPort : 4000,
  targetHost : '0.0.0.0',
  timeout    : 1e3,
  pingTimeout: 100e3,
  protocol   : 'ws',
  log        : log,
})

Pusher.set(server)

interface Module {
  actions: NMap<ActionFunc>;
  listeners: SMap<Array<(...args: any[]) => void>>;
}

for (let id in modules) {
  try {
    const module: Module = require(`${__dirname}/../modules/${modules[id]}/actions/index`)
    const actions        = module.actions || {}
    const listeners      = module.listeners || {}
    for (let key in actions) {
      server.addAction(+id << 16 + +key, actions[key])
    }
    for (let event in listeners) {
      for (let i = 0; i < listeners[event].length; i++) {
        server.on(event, listeners[event][i])
      }
    }
  } catch (_e) {
    log.warning('Could not find module<%s> register as<%H>', modules[id], id)
  }
}

