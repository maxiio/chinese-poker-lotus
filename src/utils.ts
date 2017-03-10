/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-11 00:36:03
 * @version 1.0.0
 * @desc utils.ts
 */


import { CardValues, CardColors } from './types'

function sign(a: number, b: number) {
  return a > b ? 1 : a === b ? 0 : -1
}

export class PokerCard {
  readonly value: CardValues
  readonly color: CardColors

  constructor(value: CardValues, color: CardColors) {
    this.value = value
    this.color = color
  }

  compare(card: PokerCard) {
    const a = this.value
    const b = card.value
    if (a === b) { return 0 }
    if (a > CardValues.N2 && a < CardValues.LJ) {
      return b < CardValues.N3 || b > CardValues.K ? 1 : sign(a, b)
    } else if (a < CardValues.N3) {
      return b > CardValues.K ? 1 : b > CardValues.N2 ? -1 : sign(a, b)
    } else {
      return sign(a, b)
    }
  }
}


const values = [
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

const colors = [
  CardColors.Club,
  CardColors.Diamond,
  CardColors.Heart,
  CardColors.Spade,
]

const cards: PokerCard[] = []

for (let i = 0; i < values.length; i++) {
  for (let j = 0; j < colors.length; j++) {
    cards.push(new PokerCard(values[i], colors[j]))
  }
}

cards.push(new PokerCard(CardValues.LJ, CardColors.None))
cards.push(new PokerCard(CardValues.BJ, CardColors.None))

cards.sort((a, b) => a.compare(b))

export function getInitialCards() {
  return cards.slice()
}
