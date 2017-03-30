/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:34:55
 * @version 1.0.0
 * @desc types.ts
 * 剥离用户模块, 所有信息都用Socket替换, 需要用户信息的时候再查找用户
 */


import { NMap } from '../../shared/misc'
import { UserMeta } from '../user/types'
import {
  PokerCard,
  Seats,
  PlayAction,
  TimesAction,
  FightAction,
  FightResult
} from '../../poker/types'
import { FakeDoc } from '../../db/Fake'
import { Poker } from '../../poker/Poker'

// 游戏房间状态
export enum GameStates {
  Waiting  = 1, // 准备中
  Fighting = 2, // 抢地主中
  Playing  = 3, // 出牌中
}

export enum DepositKinds {
  None    = 0, // 未托管
  Active  = 1, // 主动(客户端请求)
  Passive = 2, // 被动(出牌超时)
}

// 玩家在游戏中的信息, 单独存个表
export interface GameSeatDoc extends FakeDoc {
  id?: number; // User.id
  user?: UserMeta; // 用户信息
  gameId?: number; // 如果为空, 则在大厅内, 否则在房间内
  seat?: Seats; // 座位信息, 如果在房间内, 则不可为空
  lookOn?: boolean; // 是否旁观, TODO
  ready?: boolean; // 是否已准备
  deposit?: DepositKinds; // 托管原因
  timer?: number; // 倒计时(仅准备阶段, 出牌阶段全局只需要一个)
  expiresAt?: number; // 超时踢出
  expireCount?: number; // 连续超时未出牌次数
}

export interface GameDoc extends FakeDoc {
  seats?: NMap<number>; // 坐下人的列表
  timer?: number; // 出牌/抢地主倒计时ID
  expiresAt?: number; // 超时自动出牌
  actionId?: number; // 出牌/抢地主序号
  poker?: Poker; // 斗地主数据
  state?: GameStates; // 游戏状态
  meta?(): GameMeta;
}

// 玩家离线后数据同步
export interface GameSyncMeta {
  id: number; // 房间ID
  seats: NMap<GameSeatDoc>; // 座位信息
  state: GameStates; // 游戏状态
  actionId: number; // 当前出牌序号
  actor: Seats; // 当前出牌的座位
  expiresAt?: number; // 出牌/抢地主结束时间, Fighting,Playing才会给
  times: number; // 倍数
  fightHistory?: FightAction[]; // 抢地主历史, Fighting才会给
  fightResult?: FightResult; // 抢地主结果, Playing才会给
  playTimes?: TimesAction[]; // 出牌的倍数历史
  lastRound?: PlayAction[]; // 最后一轮出牌历史
  cards?: PokerCard[]; // 当前玩家的手牌
}

export interface GameSignIn {
  joined?: GameSyncMeta;
  list?: GameMeta[];
}

// CMD_GAME_SIGN_IN, CMD_GAME_LEAVE 返回游戏简略信息列表
// CMD_GAME_LOBBY_FLUSH 房间状态更新(用户加入, 准备, 游戏结束)
export interface GameMeta {
  id: number; // 房间ID
  seats: NMap<GameSeatDoc>;
  state: GameStates;
}

export enum JoinKinds {
  Restored   = 1, // 用户重新进入已经开始游戏的房间
  Old        = 2, // 进入一个原来有的房间
  New        = 3, // 新创建了一个房间
  ChangedOld = 4, // 用户切换进了一个已有房间
  ChangedNew = 5, // 用户切换创建了一个房间
  Original   = 6, // 用户切换了座位
}

export interface GameJoinMeta extends GameMeta, GameSyncMeta {
  kind: JoinKinds;
}

// 当玩家出牌后, 返回此结果给出牌的玩家, 并广播给其它在座的玩家
// 如果游戏结束, 则id, seat, endAt均为空, 并向所有人(包括大厅内的人)广播游戏结束信息
export interface GamePlay {
  id: number; // 当前出牌序号
  seat: Seats; // 应该出牌的座位
  action: PlayAction; // 上一手出牌的结果
  expires: number; // 截止时间
}

// 房间内游戏结束信息
export interface GameOver {
  times: number; // 倍数
  timesHistory: TimesAction[]; // 倍数历史
  remainCards: NMap<PokerCard[]>; // 没有打出的卡牌
  seats: NMap<UserMeta>; // 结算后的用户信息, 主要是积分变化
}

export interface GameFight {
  id?: number; // 序号
  seat?: Seats; // 该抢的人
  action?: FightAction; // 上一个抢地主的人抢的倍数
  banker?: FightResult; // 抢地主结束时给出结果
  play?: GamePlay; // 抢地主结束时下一手出牌情况
  expires?: number; // 截止时间
}


// 游戏开始时房间内返回数据
export interface GameStart {
  cards?: PokerCard[]; // 本人的手牌
  fight?: GameFight; // 抢地主的信息
}
