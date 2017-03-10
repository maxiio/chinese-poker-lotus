/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-11 00:36:03
 * @version 1.0.0
 * @desc deal.ts
 */

import { PokerCard, getInitialCards } from './utils'
export interface DealOptions {
  level?: number;
  boyLevels?: [number, number, number];
}

export interface DealResult {
  e: PokerCard[];
  s: PokerCard[][];
}

export function deal(options: DealOptions): DealResult {
  // TODO
  const cards = getInitialCards()
  cards.slice(options.level)
  return {
    e: cards.splice(0, 3),
    s: [
      cards.splice(0, 13),
      cards.splice(0, 13),
      cards.splice(0, 13),
    ],
  }
}
