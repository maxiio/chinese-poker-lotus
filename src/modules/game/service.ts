/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc service.ts
 */


import { Game } from './models/Game'
import { Seats, FightValues } from '../../poker/types'


export class GameService {
  static add(): Promise<Game> {
    return void 0
  }

  static join(gameId: number, socketId: number, seat?: Seats): Promise<Game> {
    console.log(gameId, socketId, seat)
    return void 0
  }

  static leave(socketId: number): Promise<Game> {
    console.log(socketId)
    return void 0
  }

  static ready(socketId: number): Promise<Game> {
    console.log(socketId)
    return void 0
  }

  static fight(socketId: number, actionId: number, value: FightValues): Promise<Game> {
    console.log(socketId, actionId, value)
    return void 0
  }

  static play(socketId: number, actionId: number, cards: number[]): Promise<Game> {
    console.log(socketId, actionId, cards)
    return void 0
  }

  static list(): Promise<Game[]> {
    return void 0
  }
}
