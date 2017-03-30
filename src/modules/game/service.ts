/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc service.ts
 *
 * 1. Socket连接
 * 2. 用户模块检查, 所以游戏中的标志不能用SocketId, 因为有断线重连的情况(或者socketId由UI层决定而不是socket自身?)
 * 2. 检查是否在房间中
 *  1. 在则自动进入
 * 3. 进入大厅, 接收广播消息
 * 4. 随机进入或者创建房间或者
 */


import { GameSeatTable, GameTable } from './tables'
import {
  GameSeatDoc,
  DepositKinds,
  GameSyncMeta,
  GameDoc,
  GameSignIn,
  GameMeta,
  GameJoinMeta
} from './types'
import { ERR_NOT_FOUND_DATA } from '../../db/Fake'
import { NMap, createNMap } from '../../shared/misc'
import { Seats } from '../../poker/types'

export const ERR_GAME_USER_NOT_IN_ROOM     = 'ERR_GAME_USER_NOT_IN_ROOM'
export const ERR_GAME_USER_IN_ROOM_ALREADY = 'ERR_GAME_USER_IN_ROOM_ALREADY'

export class GameService {
  static async getSeatsByGame(id: number): Promise<NMap<GameSeatDoc>> {
    const game  = await GameTable.find(id)
    const seats = createNMap<GameSeatDoc>()
    for (let seat in game.seats) {
      if (game.seats[seat] !== void 0) {
        seats[seat] = await GameSeatTable.find(game.seats[seat])
      }
    }
    return seats
  }

  static async getSyncMeta(gameId: number, seat: Seats): Promise<GameSyncMeta> {
    const [game, seats] = await Promise.all<GameDoc, NMap<GameSeatDoc>>([
      GameTable.find(gameId),
      GameService.getSeatsByGame(gameId),
    ])
    return {
      id          : game.id,
      seats,
      state       : game.state,
      actionId    : game.actionId,
      actor       : game.poker.getActor(),
      expiresAt   : game.expiresAt,
      times       : game.poker.getTimes(),
      fightHistory: game.poker.getFightHistory(),
      fightResult : game.poker.fightResult,
      playTimes   : game.poker.getPlayTimes(),
      lastRound   : game.poker.getLastRound(),
      cards       : game.poker.getSeatFreeCards(seat),
    }
  }

  static async listGameMeta(
    filter?: (item: GameDoc) => boolean,
    limit = 10,
  ): Promise<GameMeta[]> {
    const games = await GameTable.findList(filter, limit)
    const ss    = new Array<number>(0)
    games.forEach((game) => {
      for (let seat in game.seats) {
        if (game.seats[seat] !== void 0) {
          ss.push(game.seats[seat])
        }
      }
    })
    const meta = await GameSeatTable.findMap((item) => ss.indexOf(item.id) > 0, limit)
    return games.map((game) => ({
      id   : game.id,
      seats: {
        [Seats.A]: meta[game.seats[Seats.A]],
        [Seats.B]: meta[game.seats[Seats.B]],
        [Seats.C]: meta[game.seats[Seats.C]],
      },
      state: game.state,
    }))
  }

  static async signIn(socketId: number): Promise<GameSignIn> {
    let seat: GameSeatDoc
    try {
      seat = await GameSeatTable.find(socketId)
    } catch (e) {
      if (e.message === ERR_NOT_FOUND_DATA) {
        // 如果没有则添加
        seat = await GameSeatTable.add({
          id     : socketId,
          gameId : void 0,
          seat   : void 0,
          lookOn : false,
          ready  : false,
          deposit: DepositKinds.None,
          timer  : void 0,
        })
      }
    }
    if (seat.gameId !== void 0) {
      // 如果在房间内, 则返回同步信息
      const joined = await GameService.getSyncMeta(seat.gameId, seat.seat)
      return { joined }
    }
    return GameService.listGameMeta()
  }

  static async getSyncMetaBySocket(socketId: number): Promise<GameSyncMeta> {
    const seat = await GameSeatTable.find(socketId)
    if (!seat.gameId) {
      throw new Error(ERR_GAME_USER_NOT_IN_ROOM)
    }
    return GameService.getSyncMeta(seat.gameId, seat.seat)
  }

  static async join({ socketId, gameId, seat }: {socketId: number, gameId?: number, seat?: Seats}): Promise<GameJoinMeta> {
    console.log(socketId, gameId, seat)
    return void 0
  }
}
