/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:50:39
 * @version 1.0.0
 * @desc server.ts
 */


import { DirectServer } from '../../socket/DirectServer'
import { Log } from '../../shared/Log'
import { Pusher } from '../../socket/Pusher'
import { NMap, SMap, format } from '../../shared/misc'
import { ActionFunc } from '../../socket/types'
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
  let module: Module
  try {
    module = require(`../${modules[id]}/actions`)
  } catch (e) {
    log.warning('Could not find module<%s> register as<%H>', modules[id], id)
    continue
  }
  const actions   = module.actions || {}
  const listeners = module.listeners || {}
  for (let key in actions) {
    if (+id ^ (+key >> 16)) {
      const msg = format('The action id<%H> is not under module<%H> in <%s>',
        +key,
        +id,
        modules[id])
      log.error(msg)
      throw new Error(msg)
    }
    server.addAction(+key, actions[key])
  }
  for (let event in listeners) {
    for (let i = 0; i < listeners[event].length; i++) {
      server.on(event, listeners[event][i])
    }
  }
}

