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
import {
  Seats,
  FightAction,
  PlayAction,
  PokerCard,
  TimesAction
} from '../../../poker/types'
import { NMap } from '../../../shared/misc'
import { Poker } from '../../../poker/Poker'
import { UserMeta } from '../../user/models/types'


export interface GameModel extends FakeModel {
  seats: NMap<number>;
  poker: Poker;
  timer: number;
}

// Use for
// 1. client request list game
// 2. client request join game
// 3. server notify game state update
export interface GameMeta extends FakeModel {
  id?: number;
  users?: NMap<UserMeta>;
  ready?: NMap<boolean>;
}

/*
 Use for
 1. client request ready
 2. server notify user ready
 for avoid network delay, we need
 to client send ready response
 to server before start game
 so, the workflow is
 1. user create game -> broadcast new room
 2. other user join game -> broadcast seat update
 2.1 user leave game -> broadcast seat update
 3. user ready -> broadcast ready, start timer to tick out users unready
 */
export interface GameReady {
  seat?: Seats;
  ready?: boolean;
  start?: boolean;
  cards?: boolean;
}

export enum ActionKinds {
  Fight     = 1,
  Play      = 2,
  ForcePlay = 3,
  GameOver  = 4,
}

export interface GameReady {

}

export interface FightResult {
  landlord: Seats;
  time: TimesAction;
  bases: PokerCard[];
}

export interface ActionMeta {
  // 当前一手的id, 第一次抢地主为0, 往后连续递增, 不可间断
  id: number;
  // 类型: 抢地主1, 出牌2, 必需出牌3(不可过)
  kind: ActionKinds;
  // 当前应该出牌/抢地主的玩家
  actor: Seats;
  // 上一手是抢地主则不为空
  fight?: FightAction;
  // 如果上一手是抢地主并且下一手是出牌, 则
  // 抢地主结束, 这个时候需要发
  fightResult?: FightResult;
  // 上一手为出牌则不为空
  play?: PlayAction;
}


export interface GameSocketModel extends FakeModel {
  socketId: number;
  userId: number;
  gameId: number;
  seat: Seats;
}
