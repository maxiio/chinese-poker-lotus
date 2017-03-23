/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc index.ts
 */

import { ClientInstance } from '../../../csb/Server'
import {
  CONF_FIELD_SESSION,
  CONF_FIELD_USER_ID,
  CONF_FIELD_PASSWORD,
  CMD_USER_SIGN_IN,
  CMD_USER_SIGN_OUT,
  CMD_USER_UPDATE
} from '../consts'
import { UserModel } from '../models/types'
import { UserService } from '../service'
import { Pusher } from '../../../csb/Pusher'
import { Responser, MessageEncodings, ReservedResults } from '../../../csb/types'


function onConnect(client: ClientInstance) {
  const session  = client.headers[CONF_FIELD_SESSION]
  const socket   = client.id
  const id       = +client.headers[CONF_FIELD_USER_ID]
  const password = client.headers[CONF_FIELD_PASSWORD]
  let p: Promise<UserModel>
  if (id && password) {
    p = UserService.findAndVerify(id, password)
  } else if (session) {
    p = UserService.findBySession(session)
  } else {
    p = Promise.reject(new Error('Invalid Reuqest'))
  }
  p.then((user) => {
    UserService.setSocket(user.id, socket)
    if (!session) {
      UserService.signIn(user.id)
    }
    Pusher.get().request({
      action: CMD_USER_SIGN_IN,
    }, socket, false)
  }, () => {
    Pusher.get().closeRemote(socket)
  })
}

function onClose(client: ClientInstance) {
  UserService.findBySocket(client.id)
    .then((user) => UserService.setSocket(user.id, void 0))
}

export const listeners = {
  connect: [onConnect],
  closed : [onClose],
}

export function signOut(man: Responser) {
  man.send()
  UserService.find(man.from).then((user) => {
    UserService.signOut(user.id)
  })
}

// TODO add user id information to session and client information avoid query twice
// TODO check parameters in service
// TODO omit useless and secret fields to output
export function update(man: Responser) {
  UserService.find(man.from)
    .then((user) => UserService.update(user.id, man.request.data))
    .then((user) => man.send(user, MessageEncodings.Json))
    .catch((err) => man.setResult(ReservedResults.InternalError)
      .send(err, MessageEncodings.Json))
}

export const actions = {
  [CMD_USER_SIGN_OUT]: signOut,
  [CMD_USER_UPDATE]  : update,
}
