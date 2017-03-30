/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-28 15:47:34
 * @version 1.0.0
 * @desc tables.ts
 */


import { FakeTable } from '../../db/Fake'
import { GameDoc, GameSeatDoc } from './types'


export const GameTable = new FakeTable<GameDoc>('Game')

export const GameSeatTable = new FakeTable<GameSeatDoc>('GameSeat', ['socketId'])
