/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-24 23:18:15
 * @version 1.0.0
 * @desc robots.ts
 */


import {
  Seats,
  PokerCard,
  FightAction,
  TimesAction,
  PlayAction,
  FightValues
} from './types'
import { sortCards } from './utils'
import { splice } from '../shared/misc'


export abstract class Robot {
  protected landlord: Seats
  readonly seat: Seats
  protected cards: PokerCard[]
  protected usedCards: PokerCard[]
  protected freeCards: PokerCard[]
  protected baseCards: PokerCard[]
  protected fights: FightAction[]
  protected times: TimesAction[]
  protected plays: PlayAction[][]
  protected depositing: boolean

  constructor(
    seat: Seats,
    cards: PokerCard[],
    landlord?: Seats,
    base: PokerCard[] = [],
    fights: FightAction[] = [],
    plays: PlayAction[][] = [],
    times: TimesAction[] = [],
  ) {
    cards           = sortCards(cards)
    this.seat       = seat
    this.cards      = cards
    this.freeCards  = cards.slice()
    this.landlord   = landlord
    this.baseCards  = base
    this.fights     = fights
    this.plays      = plays
    this.times      = times
    this.depositing = false
    plays.forEach((round) => round.forEach((play) => {
      play.seat === seat && this.useCards(...play.cards)
    }))
  }

  setLandlord(seat: Seats, cards: PokerCard[]) {
    if (this.landlord !== void 0) {
      throw new Error('Could not re-set landlord')
    }
    this.landlord  = seat
    this.baseCards = cards
    if (this.seat === seat) {
      this.cards.push(...cards)
      this.freeCards.push(...cards)
      sortCards(this.cards)
      sortCards(this.freeCards)
    }
    return this
  }

  syncFight(fight: FightAction) {
    if (this.landlord !== void 0) {
      throw new Error('Could not fight when playing')
    }
    this.fights.push(fight)
    return this
  }

  syncPlay(play: PlayAction) {
    if (this.landlord === void 0) {
      throw new Error('Could play when fighting')
    }
    this.plays[this.plays.length - 1].push(play)
    return this
  }

  setDeposit(deposit: boolean) {
    this.depositing = deposit
    return this
  }

  newRound() {
    this.plays.push([])
  }

  destroy() {
  }

  protected useCards(...cards: PokerCard[]) {
    cards.forEach((card) => {
      splice(this.freeCards, card)
      this.usedCards.push(card)
    })
    return cards
  }

  protected abstract doFight(): FightValues

  fight(): FightValues {
    if (this.landlord !== void 0) {
      throw new Error('Could not fight when playing')
    }
    return this.doFight()
  }

  protected abstract doPlay(): PokerCard[]

  play(): number[] {
    if (this.landlord === void 0) {
      throw new Error('Cound not play when fighting')
    }
    return this.useCards(...this.doPlay()).map((card) => card.id)
  }
}


export class AutomaticRobot extends Robot {
  doFight() {
    return FightValues.Pass
  }

  doPlay() {
    if (this.plays[this.plays.length - 1].length === 0) {
      return this.freeCards.slice(0, 1)
    }
    return []
  }
}
