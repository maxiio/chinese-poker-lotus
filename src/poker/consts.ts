/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-13 13:32:53
 * @version 1.0.0
 * @desc consts.ts
 */


import { CardValues, TimesKinds, FightValues, Seats, CardColors } from './types'
import { NMap } from '../utils'
import { createNMap } from '../shared/utils'


export const TIME_VALUES = createNMap<number>({
  [TimesKinds.FightOne]         : 1,
  [TimesKinds.FightTwo]         : 2,
  [TimesKinds.FightThree]       : 3,
  [TimesKinds.BaseJokerPair]    : 8,
  [TimesKinds.BaseStraightFlush]: 8,
  [TimesKinds.BaseThree]        : 8,
  [TimesKinds.BaseFlush]        : 8,
  [TimesKinds.BaseStraight]     : 4,
  [TimesKinds.BaseJoker]        : 4,
  [TimesKinds.BasePair]         : 4,
  [TimesKinds.BaseNormal]       : 1,
  [TimesKinds.Bomb]             : 2,
})

export const REAL_SEATS: Seats[] = [Seats.A, Seats.B, Seats.C]
export const ALL_SEATS: Seats[]  = [Seats.A, Seats.B, Seats.C, Seats.Base]

export const SEAT_CARD_SIZE  = 17
export const BASE_CARD_SIZE  = 3
export const TOTAL_CARD_SIZE = SEAT_CARD_SIZE * REAL_SEATS + BASE_CARD_SIZE

export const NEXT_SEATS = createNMap<Seats>({
  [Seats.A]: Seats.B,
  [Seats.B]: Seats.C,
  [Seats.C]: Seats.A,
})

export const MAP_FIGHT_TO_TIMES = createNMap<TimesKinds>({
  [FightValues.One]  : TimesKinds.FightOne,
  [FightValues.Two]  : TimesKinds.FightTwo,
  [FightValues.Three]: TimesKinds.FightThree,
})


export const CARD_VALUES: CardValues[] = [
  CardValues.A,
  CardValues.N2,
  CardValues.N3,
  CardValues.N4,
  CardValues.N5,
  CardValues.N6,
  CardValues.N7,
  CardValues.N8,
  CardValues.N9,
  CardValues.N10,
  CardValues.J,
  CardValues.Q,
  CardValues.K,
]


export const CARD_COLORS: CardColors[] = [
  CardColors.Club,
  CardColors.Diamond,
  CardColors.Heart,
  CardColors.Spade,
]
