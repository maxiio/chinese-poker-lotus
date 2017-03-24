/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-24 18:13:06
 * @version 1.0.0
 * @desc GameSocket.ts
 */


import { Fake } from '../../../db/Fake'
import { GameSocketModel } from './types'


export class GameSocket extends Fake<GameSocketModel> {
  static readonly NS = <string>'game_socket'

  static readonly UNIQUE_INDEXES: string[] = ['socketId', 'userId', 'gameId']
}
