/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-11 12:01:12
 * @version 1.0.0
 * @desc Poker.ts
 *
 * 斗地主牌模型, 这才是核心
 *
 * 1. 洗牌: 整体强度控制, 角色强度控制
 * 2. 发牌: 底牌三张, 三副玩家牌各十七张
 * 3. 叫斗地主: 逻辑限制: 分数只能增加或者Pass, 三家都没叫, 则回到状态1, 需要计倍数及玩家角色: 地主, 农民
 * 4. 出牌: 牌型有效性判断, 大小判断(同型, 炸弹, Pass), 自动出牌, 出牌推荐, 结束判断
 * 5. 结束
 *
 * ```ts
 * const poker = new Poker(1, [1, 1, 1]).deal()
 * poker.fight(0, 3)
 * poker.isPlaying() && poker.play(0, [])
 * poker.isFinished() && poker.getUnusedCards(0)
 * ```
 */


import { EventEmitter } from 'events'
import {
  Seats,
  PokerCardMeta,
  PokerCard,
  PokerStates,
  FightAction,
  PlayAction,
  TimesAction,
  FinishReason,
  SeatVisibleData,
  ActionErrors,
  PlayKinds,
  FightValues
} from './types'
import { Lotus } from './Lotus'
import { NMap, inEnum } from '../shared/utils'
import { RandomLotus } from './RandomLotus'
import { MAP_FIGHT_TO_TIMES, NEXT_SEATS, TIME_VALUES, ALL_SEATS } from './constants'
import { getBaseKind, parsePlayAction } from './utils'


export class Poker extends EventEmitter {
  // 开始抢地主的人
  readonly fightStarter: Seats
  // 洗牌机
  readonly lotus: Lotus

  // 所有卡牌及其状态表
  private cards: NMap<PokerCardMeta>

  // 底牌
  private base: PokerCard[]

  // 发牌程序发出的卡牌(未排序)
  private originalCards: NMap<PokerCard[]>

  // 游戏状态
  private state: PokerStates

  // 地主座位
  private landlord: Seats

  // 倍数, 可以动态通过timesHistory计算
  private times: number

  // 抢地主历史
  private fightHistory: FightAction[]

  // 出牌历史, 每一回合会出若干手牌, 最后两手一定为过
  private playHistory: PlayAction[][]

  // 加倍记录
  private timesHistory: TimesAction[]

  // 连续不出牌玩家个数, 为2时回合结束
  private passCount: number

  // 上一手牌的类型(第一手为void 0, 为Pass则用上一手)
  private lastPlay: PlayAction

  // 当前应该出牌的玩家
  private actor: Seats

  // 游戏结束的原因
  private finishReason: FinishReason

  constructor(
    fightStarter = Seats.A,
    lotus: Lotus = new RandomLotus(),
  ) {
    super()
    this.fightStarter = fightStarter
    this.lotus        = lotus
  }

  /**
   * 获取用户可见数据, 用于断线重连时重置状态
   * @param seat
   * @param hideHistory
   * @return {SeatVisibleData}
   */
  dumpSeatVisibleData(seat: Seats, hideHistory = false): SeatVisibleData {
    const base        = this.state === PokerStates.Fighting
      ? void 0
      : this.originalCards[Seats.Base].slice()
    const playHistory = hideHistory
      ? void 0
      : this.playHistory.map((item) => item.slice())
    return <SeatVisibleData>{
      seat        : seat,
      state       : this.state,
      times       : this.times,
      actor       : this.actor,
      landlord    : this.landlord,
      fightHistory: this.fightHistory.slice(),
      timesHistory: this.timesHistory.slice(),
      playHistory : playHistory,
      lastPlay    : this.lastPlay,
      cards       : this.originalCards[seat].filter((card) => !this.cards[card.id].used),
      base        : base,
    }
  }

  /**
   * 发牌
   * 初始化卡牌相关变量
   * {@see Poker#cards}
   * {@see Poker#base}
   * {@see Poker#originalCards}
   * {@see Poker#state}
   * {@see Poker#landlord}
   * {@see Poker#times}
   * {@see Poker#fightHistory}
   * {@see Poker#playHistory}
   * {@see Poker#timesHistory}
   * {@see Poker#actor}
   * {@see Poker#finishReason}
   * @return {Poker}
   */
  deal() {
    this.lotus.shuffle()
    this.cards = {}
    ALL_SEATS.forEach((seat) => {
      const cards  = this.lotus.getCardsBySeat(seat)
      const isBase = seat === Seats.Base
      isBase && (this.base = cards)
      this.originalCards[seat] = cards
      cards.forEach((card) => {
        this.cards[card.id] = {
          seat  : seat,
          card  : card,
          used  : false,
          isBase: isBase,
        }
      })
    })
    this.times        = 1
    this.fightHistory = []
    this.timesHistory = []
    this.actor        = this.fightStarter
    this.finishReason = void 0
    this.state        = PokerStates.Fighting
    return this
  }

  /**
   * 执行抢地主, 成功返回Success, 否则对应的Code, 可能改变状态到Playing或Finished
   * @param seat
   * @param value
   * @return {ActionErrors}
   */
  fight(seat: Seats, value: FightValues) {
    if (this.state !== PokerStates.Fighting) {
      // 状态无效
      return ActionErrors.ForbiddenAction
    }
    if (this.actor !== seat) {
      // 座位有效性
      return ActionErrors.ForbiddenSeat
    }
    const history = this.fightHistory
    if (!inEnum(value, FightValues)
        || (history.length && history[history.length - 1].value >= value)) {
      // 倍数无效
      return ActionErrors.FightBadValue
    }
    // 正常
    const fight: FightAction = { seat, value }
    history.push(fight)
    this.actor = NEXT_SEATS[seat]
    if (history.length === 3 || value === FightValues.Three) {
      // 终止抢地主
      this.finishFight()
    }
    return ActionErrors.Success
  }

  finish(reason: FinishReason) {
    this.actor        = void 0
    this.finishReason = reason
    this.state        = PokerStates.Finished
    return this
  }

  private addTimes(action: TimesAction) {
    this.times *= TIME_VALUES[action.kind]
    this.timesHistory.push(action)
  }

  private finishFight() {
    const fight = this.fightHistory.filter((f) => f.value !== FightValues.Pass).pop()
    if (!fight) {
      // 结束游戏
      this.finish(FinishReason.FightAllPass)
      return
    }
    this.landlord = fight.seat
    // 记录抢地主倍数
    this.addTimes({
      kind: MAP_FIGHT_TO_TIMES[fight.value],
      seat: fight.seat,
    })
    // 底牌发给地主
    this.base.forEach((card) => {
      this.cards[card.id].seat = fight.seat
    })
    // 记录底牌倍数
    this.addTimes({
      kind : getBaseKind(this.base),
      seat : Seats.Base,
      cards: this.originalCards[Seats.Base].slice(),
    })
    // 改变状态
    this.state = PokerStates.Playing
    // 开始新一轮游戏
    this.startRound(fight.seat)
  }

  private startRound(seat: Seats) {
    this.actor     = seat
    this.lastPlay  = void 0
    this.passCount = 0
    this.playHistory.push([])
  }

  play(seat: Seats, cardIdList: number[]) {
    if (this.actor !== seat) {
      return ActionErrors.ForbiddenSeat
    }
    const cards = new Array<PokerCard>(cardIdList.length)
    for (let i = 0; i < cardIdList.length; i++) {
      const id = cardIdList[i]
      if (!this.cards[id] || this.cards[id].seat !== seat || this.cards[id].used) {
        return ActionErrors.PlayBadCards
      }
      cards[i] = this.cards[id].card
    }
    const action = parsePlayAction(cards, seat)
    if (action.kind === PlayKinds.None) {
      return ActionErrors.PlayIsNotHand
    }
    const prev = this.lastPlay
    if (prev === void 0) {
      if (action.kind === PlayKinds.Pass) {
        return ActionErrors.PlayForbiddenPass
      }
    } else if (action.kind !== PlayKinds.Pass) {
      if (prev.cards.length !== action.cards.length
          || (prev.kind !== action.kind && action.kind !== PlayKinds.Bomb)) {
        return ActionErrors.PlayBadActionKind
      }
      if (prev.mainCard.value >= action.mainCard.value) {
        return ActionErrors.PlayBadValue
      }
    }
    for (let i = 0; i < cardIdList.length; i++) {
      this.cards[cardIdList[i]].used = true
    }
    this.playHistory[this.playHistory.length - 1].push(action)
    if (action.kind === PlayKinds.Pass && ++this.passCount === 2) {
      this.startRound(seat)
    } else {
      this.actor    = NEXT_SEATS[seat]
      this.lastPlay = action
    }
    return ActionErrors.Success
  }
}
