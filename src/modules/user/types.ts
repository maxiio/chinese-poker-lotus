/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:34:55
 * @version 1.0.0
 * @desc types.ts
 */


import { FakeDoc } from '../../db/Fake'

export interface UserDoc extends FakeDoc {
  username?: string;
  nickname?: string;
  password?: string;
  sessionId?: string;
  socketId?: number;
  createdAt?: number;
  score?: number;
  autoPure?(id: number): this;
}


// 用户简略信息
export interface UserMeta {
  id?: number; // 用户ID
  nickname?: string; // 昵称
  createdAt?: number; // 加入时间
  score?: number; // 积分
}
