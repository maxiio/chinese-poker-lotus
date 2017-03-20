/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-13 14:41:26
 * @version 1.0.0
 * @desc RandomLotus.ts
 */


import { BaseCards, SeatCards, PokerCard, Seats } from './types'
import { REAL_SEATS, SEAT_CARD_SIZE } from './consts'
import { getInitialCards } from './utils'
import { Lotus } from './Lotus'
import { random } from '../shared/utils'

export class RandomLotus extends Lotus {
  constructor() { super() }

  shuffle() {
    this.seats  = createNMap<PokerCard[]>()
    const cards = getInitialCards()
    REAL_SEATS.forEach((seat) => {
      this.seats[seat] = new Array<PokerCard>(SEAT_CARD_SIZE)
      for (let i = 0; i < SEAT_CARD_SIZE; i++) {
        this.seats[seat][i] = cards.splice(random(0, cards.length - 1)).pop()
      }
    })
    this.seats[Seats.Base] = cards.slice()
  }
}
