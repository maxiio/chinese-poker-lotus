/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:34:55
 * @version 1.0.0
 * @desc types.ts
 */


import { FakeModel } from '../../../db/Fake'


export interface UserModel extends FakeModel {
  id?: number;
  username?: string;
  password?: string;
  nickname?: string;
  session?: string;
  socket?: number;
  createdAt?: number;
  score?: number;
}


export interface UserMeta {
  id: number;
  nickname: string;
  createdAt: number;
  score: number;
}
