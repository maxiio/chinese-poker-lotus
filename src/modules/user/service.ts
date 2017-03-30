/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc service.ts
 */


import { UserMeta, UserDoc } from './types'
import { UserTable } from './tables'


export const ERR_USER_INCORRECT_PASSWORD = 'ERR_USER_INCORRECT_PASSWORD'


export class UserService {

  static find(id: number): Promise<UserMeta> {
    return UserTable.find(id).then((user) => user.pure('custom'))
  }

  static add(data: UserDoc): Promise<UserDoc> {
    data.createdAt = data.createdAt || +new Date
    data.score     = data.score || 0
    data.nickname  = data.nickname || data.username
    return UserTable.add(data)
  }

  static list(filter?: (item: UserDoc) => boolean, limit = 10): Promise<UserMeta[]> {
    return UserTable
      .findList(filter, limit)
      .then((users) => users.map((user) => user.pure('custom')))
  }

  static update(data: UserDoc): Promise<UserMeta> {
    return UserTable.update(data).then((user) => user.pure('custom'))
  }

  static signIn(id: number): Promise<UserMeta> {
    const sessionId = `%${+new Date}${Math.random()}`
    return UserTable.update({ id, sessionId }).then((user) => user.pure('session'))
  }

  static signOut(id: number): Promise<UserMeta> {
    return UserTable.update({ id, sessionId: void 0 }).then((user) => user.pure('custom'))
  }

  static addScore(id: number, score: number): Promise<UserMeta> {
    return UserTable.find(id)
      .then((user) => UserTable.update({ id, score: user.score + score }))
      .then((user) => user.pure('custom'))
  }

  static delScore(id: number, score: number): Promise<UserMeta> {
    return UserTable.find(id)
      .then((user) => UserTable.update({ id, score: Math.max(0, user.score - score) }))
      .then((user) => user.pure('custom'))
  }

  static setSocket(id: number, socketId: number): Promise<UserMeta> {
    return UserTable.update({ id, socketId })
      .then((user) => user.pure('custom'))
  }

  static findBySocket(socketId: number): Promise<UserMeta> {
    return UserTable.findByIndex('socketId', socketId).then((user) => user.pure('custom'))
  }

  static findBySession(sessionId: string): Promise<UserMeta> {
    return UserTable.findByIndex('sessionId', sessionId).then((u) => u.pure('custom'))
  }

  static findAndVerify(id: number, password: string): Promise<UserMeta> {
    return UserTable.find(id)
      .then((user) => user.password === password
        ? Promise.resolve(user.pure('custom'))
        : Promise.reject(new Error(ERR_USER_INCORRECT_PASSWORD)))
  }
}
