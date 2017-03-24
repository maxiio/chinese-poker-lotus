/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-13 15:40:47
 * @version 1.0.0
 * @desc Lotus.ts
 */


import { PokerCard, Seats } from './types'
import { NMap, createNMap } from '../shared/misc'
import { BASE_CARD_SIZE, SEAT_CARD_SIZE } from './constants'


export abstract class Lotus {
  protected seats: NMap<PokerCard[]> = createNMap<PokerCard[]>()

  abstract shuffle(): void;

  /**
   * we need a new access modifier `final` to avoid override a method or property
   * @param seat
   * @return {PokerCard[]}
   * @final
   */
  getCardsBySeat(seat: Seats) {
    const cards = this.seats[seat]
    const size  = seat === Seats.Base ? BASE_CARD_SIZE : SEAT_CARD_SIZE
    if (!cards || cards.length !== size) {
      throw new Error('The lotus is not ready for deal cards!')
    }
    return cards.slice()
  }
}
