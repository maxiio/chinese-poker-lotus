/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:38:41
 * @version 1.0.0
 * @desc User.ts
 */


import { FakeTable } from '../../db/Fake'
import { UserDoc } from './types'

export const UserTable = new FakeTable<UserDoc>('User', [
  'socketId',
  'sessionId',
  'username',
  'nickname'
], {
  custom : ['id', 'nickname', 'createdAt', 'score'],
  session: ['id', 'nickname', 'createdAt', 'score', 'session'],
  owner  : ['id', 'username', 'nickname', 'createdAt', 'score'],
}, {
  autoPure: function (this: UserDoc, id: number) {
    return this.id === id ? this.pure('owner') : this.pure('custom')
  },
})
