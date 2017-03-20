/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-13 13:32:17
 * @version 1.0.0
 * @desc types.ts
 */


export enum TimesKinds {
  FightOne          = 0x01, // 叫地主一次
  FightTwo          = 0x02, // 叫地主二次
  FightThree        = 0x03, // 叫地主三次

  BaseJokerPair     = 0x11, // 底牌二鬼
  BaseStraightFlush = 0x12, // 底牌同花顺: 同花顺/一鬼+两牌
  BaseThree         = 0x13, // 底牌三张: 三张/一鬼+两张
  BaseFlush         = 0x14, // 底牌同花: 同花/一鬼+两同花
  BaseStraight      = 0x15, // 底牌顺子: 顺子/一鬼+两牌
  BaseJoker         = 0x16, // 底牌一鬼
  BasePair          = 0x17, // 底牌对子
  BaseNormal        = 0x18,

  Bomb              = 0x21, // 出牌炸弹
}


export interface TimesAction {
  kind: TimesKinds; // 加倍类型
  seat: Seats; // 来源
  cards?: PokerCard[];
}

export enum Seats {
  A    = 0, // 用户1
  B    = 1, // 用户2
  C    = 2, // 用户3
  Base = 100, // 底牌
}


export enum FightValues {
  Pass  = 0,
  One   = 1,
  Two   = 2,
  Three = 3,
}
export interface FightAction {
  seat: Seats;
  value: FightValues;
}


export enum CardValues {
  N3  = 3,
  N4  = 4,
  N5  = 5,
  N6  = 6,
  N7  = 7,
  N8  = 8,
  N9  = 9,
  N10 = 10,
  J   = 11,
  Q   = 12,
  K   = 13,
  A   = 14,
  N2  = 15,
  LJ  = 16,
  BJ  = 17,
}

export enum CardColors {
  None    = 0,
  Club    = 1,
  Diamond = 2,
  Heart   = 3,
  Spade   = 4,
}

export interface PokerCard {
  readonly id: number;
  readonly value: CardValues; // 点数
  readonly color: CardColors; // 花色
}

export interface PokerCardMeta {
  readonly card: PokerCard;
  readonly isBase: boolean;
  used: boolean;
  seat: Seats;
}

export enum PlayKinds {
  None                = 0, // 不是一手有效的牌

  Single              = 0x01, // 单牌, 比大小

  Pair                = 0x11, // 一对, 比大小

  Three               = 0x21, // 三张, 比大小
  ThreeAndOne         = 0x22, // 三带一, 比三张大小
  FullHouse           = 0x23, // 三带二, 比三张大小

  Straight            = 0x31, // 顺子, 比第一张大小
  StraightPair        = 0x32, // 连对, 比第一张大小
  StraightThree       = 0x33, // 飞机(不带), 比三张第一张大小
  StraightThreeAndOne = 0x34, // 飞机(带一), 比三张第一张大小
  StraightThreeAndTwo = 0x35, // 飞机(带二), 比三张第一张大小

  FourAndTwo          = 0x51, // 四带二, 比四张大小
  FourAndTwoPair      = 0x52, // 四带二对, 比四张大小

  Bomb                = 0x100, // 炸弹(四张或双王), 比大小

  Pass                = 0x1000, // 过, 我最大
}

// 具有可比性的两手牌(同类型, 可以带多个的单例的单例的个数相同, 比如连对789和8910), 张数一定相同
// 同一种类型的牌, 如果对数不一样, 张数一定不同
// 不会出现A带B, A相同但是B不同的情况
// 所以只需要确定一张牌即可进行比较
// 除了炸弹和三带一外, 一手牌只能有一种牌型
export interface PlayAction {
  readonly kind: PlayKinds;
  readonly seat: Seats;
  readonly cards: PokerCard[];
  // 用来进行比较的牌, 这张牌是针对斗地主牌型的优化
  readonly mainCard: PokerCard;
}


export enum PokerStates {
  Fighting = 1,
  Playing  = 2,
  Finished = 3,
}


export enum ActionErrors {
  Success           = 0, // 操作成功

  ForbiddenSeat     = 0x101, // 不是当前应该出牌的玩家
  ForbiddenAction   = 0x102, // 游戏状态不允许当前操作

  FightBadValue     = 0x201, // 抢地主倍数过小

  PlayIsNotHand     = 0x301, // 不是有效的一手牌
  PlayBadValue      = 0x302, // 牌大不过上家
  PlayForbiddenPass = 0x303, // 首家禁止过
  PlayBadActionKind = 0x304, // 与上家的手牌类型不同
  PlayBadCards      = 0x305, // 手牌已打出, 或者手牌不存在, 或者手牌不属于当前座位
}

export interface SeatVisibleData {
  seat: Seats;
  state: PokerStates;
  times: number;
  actor: Seats;
  landlord?: Seats;
  fightHistory: FightAction[];
  timesHistory: TimesAction;
  playHistory?: PlayAction[][];
  lastPlay: PlayAction;
  cards: PokerCard[];
  base?: PokerCard[];
}

export enum FinishReason {
  GameOver     = 1, // 正常结束
  Abort        = 2, // 中途中止
  FightAllPass = 3, // 无人抢地主
}
