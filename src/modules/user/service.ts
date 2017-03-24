/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc service.ts
 */


import { UserModel } from './models/types'
import { User } from './models/User'


export class UserService {

  static find(id: number): Promise<UserModel> {
    return User.find(id)
  }

  static add(data: UserModel): Promise<UserModel> {
    data.createdAt = data.createdAt || +new Date
    data.score     = data.score || 0
    return User.add(data)
  }

  static list(filter?: (item: UserModel) => boolean, max = 10): Promise<UserModel[]> {
    return User.list(filter, max)
  }

  static update(id: number, data: UserModel): Promise<UserModel> {
    return User.update(id, data)
  }

  static signIn(id: number): Promise<UserModel> {
    const session = `%${+new Date}${Math.random()}`
    return User.update(id, { session })
  }

  static signOut(id: number): Promise<UserModel> {
    return User.update(id, { session: void 0 })
  }

  static addScore(id: number, score: number): Promise<UserModel> {
    return User.find(id).then((user) => User.update(id, { score: user.score + score }))
  }

  static delScore(id: number, score: number): Promise<UserModel> {
    return User.find(id)
      .then((user) => User.update(id, { score: Math.max(0, user.score - score) }))
  }

  static setSocket(id: number, socket: number): Promise<UserModel> {
    return User.update(id, { socket })
  }

  static findBySocket(socket: number): Promise<UserModel> {
    return User.findByIndex('socket', socket)
  }

  static findBySession(session: string): Promise<UserModel> {
    return User.findByIndex('session', session)
  }

  static findAndVerify(id: number, password: string): Promise<UserModel> {
    return User.find(id)
      .then((user) => user.password === password
        ? Promise.resolve(user)
        : Promise.reject(new Error('Password is incorrect')))
  }
}
