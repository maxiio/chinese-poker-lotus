/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:38:41
 * @version 1.0.0
 * @desc User.ts
 */


import { Fake, fake } from '../../../db/Fake'
import { UserModel } from './types'

@fake
export class User extends Fake<UserModel> {
  static readonly NS = <string>'user'

  static readonly UNIQUE_INDEXES: string[] = ['session', 'socket']
}
