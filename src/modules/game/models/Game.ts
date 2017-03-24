/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-24 18:13:45
 * @version 1.0.0
 * @desc Game.ts
 */


import { Fake } from '../../../db/Fake'
import { GameModel } from './types'


export class Game extends Fake<GameModel> {
  static readonly NS = <string>'game'

  static readonly UNIQUE_INDEXES: string[] = []
}
