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
import { Seats } from '../../../poker/types'
import { NMap } from '../../../shared/misc'
import { Poker } from '../../../poker/Poker'


export interface GameModel extends FakeModel {
  seats: NMap<number>;
  poker: Poker;
  timer: number;
}


export interface GameSocketModel extends FakeModel {
  socketId: number;
  userId: number;
  gameId: number;
  seat: Seats;
}
