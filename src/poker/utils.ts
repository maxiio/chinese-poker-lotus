/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-13 13:21:55
 * @version 1.0.0
 * @desc utils.ts
 */


import { CARD_COLORS, CARD_VALUES, TOTAL_CARD_SIZE } from './constants'
import {
  PokerCard,
  CardValues,
  CardColors,
  TimesKinds,
  PlayKinds,
  PlayAction,
  Seats
} from './types'


/**
 * 卡牌排序
 * @param cards
 * @param copy
 * @return {PokerCard[]}
 */
export function sortCards(cards: PokerCard[], copy = false) {
  copy && (cards = cards.slice())
  return cards.sort((a, b) => a.value - b.value || a.color - b.color)
}

export function createCard(id: number, value: CardValues, color: CardColors): PokerCard {
  return Object.freeze<PokerCard>({
    id,
    value,
    color,
  })
}

/**
 * 初始新牌, 顺序: CA...CK,DA...DK,HA...HK,SA...SK,LJ,BJ
 * id: 0 => 53
 */
const INITIAL_CARDS = new Array<PokerCard>(TOTAL_CARD_SIZE);
(function () {
  let id = 0
  for (let i = 0; i < CARD_COLORS.length; i++) {
    for (let j = 0; j < CARD_VALUES.length; j++) {
      INITIAL_CARDS[id] = createCard(id++, CARD_VALUES[j], CARD_COLORS[j])
    }
  }
  INITIAL_CARDS[id] = createCard(id++, CardValues.LJ, CardColors.None)
  INITIAL_CARDS[id] = createCard(id + 1, CardValues.BJ, CardColors.None)
})()

export function getInitialCards() {
  return INITIAL_CARDS.slice()
}

export function getBaseKind(base: PokerCard[]) {
  const [c0, c1, c2] = sortCards(base.slice())
  const jokerCount   = c1.value > CardValues.N2 ? 2 : c2.value > CardValues.N2 ? 1 : 0
  if (jokerCount === 2) {
    return TimesKinds.BaseJokerPair
  } else if (jokerCount === 1
             && c0.color === c1.color
             && (c0.value + 1 === c1.value || c0.value + 2 === c1.value)) {
    return TimesKinds.BaseStraightFlush
  } else if (c0.value + 1 === c1.value && c0.value + 2 === c2.value
             && c0.color === c1.color && c0.color === c2.color) {
    return TimesKinds.BaseStraightFlush
  } else if (jokerCount === 1 && c0.value === c1.value) {
    return TimesKinds.BaseThree
  } else if (c0.value === c1.value && c0.value === c1.value) {
    return TimesKinds.BaseThree
  } else if (jokerCount === 1 && c0.color === c1.color) {
    return TimesKinds.BaseFlush
  } else if (c0.color === c1.color && c0.color === c2.color) {
    return TimesKinds.BaseFlush
  } else if (jokerCount === 1
             && (c0.value + 1 === c1.value || c0.value + 2 === c1.value)) {
    return TimesKinds.BaseStraight
  } else if (c0.value + 1 === c1.value && c0.value + 2 === c2.value) {
    return TimesKinds.BaseStraight
  } else if (jokerCount === 1) {
    return TimesKinds.BaseJoker
  } else if (c1.value === c0.value || c1.value === c2.value) {
    return TimesKinds.BasePair
  } else {
    return TimesKinds.BaseNormal
  }
}

export function parsePlayAction(cards: PokerCard[], seat: Seats): PlayAction {
  let kind: PlayKinds
  let mainCard: PokerCard
  sortCards(cards)
  if (cards.length === 0) {
    // is pass
    kind     = PlayKinds.Pass
    mainCard = void 0
  }
  if (kind === void 0 && cards.length === 1) {
    // is single
    kind     = PlayKinds.Single
    mainCard = cards[0]
  }
  if (kind === void 0 && cards.length === 2) {
    // must be JokerPair or Pair
    // Joker
    // 两张相同
    if (cards[0].value === CardValues.LJ) {
      kind     = PlayKinds.Bomb
      mainCard = cards[0]
    } else if (cards[0].value === cards[1].value) {
      kind     = PlayKinds.Pair
      mainCard = cards[0]
    } else {
      kind     = PlayKinds.None
      mainCard = void 0
    }
  }
  if (kind === void 0 && cards.length === 3) {
    // must be Three
    // 三张相同
    if (cards[0].value === cards[2].value) {
      kind     = PlayKinds.Three
      mainCard = cards[0]
    } else {
      kind     = PlayKinds.None
      mainCard = void 0
    }
  }
  if (kind === void 0 && cards.length === 4) {
    // must be Bomb or ThreeAndOne
    // 四张
    // 三张+一张
    if (cards[0].value === cards[3].value) {
      kind     = PlayKinds.Bomb
      mainCard = cards[0]
    } else if (cards[0].value === cards[2].value || cards[1].value === cards[3].value) {
      kind     = PlayKinds.ThreeAndOne
      // 第一张必定是主牌
      mainCard = cards[1]
    } else {
      kind     = PlayKinds.None
      mainCard = void 0
    }
  }
  if (kind === void 0 && cards.length === 5) {
    // check FullHouse(ThreeAndOne)
    // 三张+两张
    if (cards[0].value === cards[2].value && cards[3].value === cards[4].value) {
      kind     = PlayKinds.FullHouse
      mainCard = cards[0]
    } else if (cards[0].value === cards[1].value && cards[2].value === cards[4].value) {
      kind     = PlayKinds.FullHouse
      mainCard = cards[2]
    }
  }
  if (kind === void 0 && cards.length > 4) {
    // check Straight
    // 连续不相同
    let ok = true
    for (let i = cards.length - 1; i > 0; i--) {
      if (cards[i].value - 1 !== cards[i - 1].value) {
        ok = false
        break
      }
    }
    if (ok) {
      kind     = PlayKinds.Straight
      mainCard = cards[0]
    }
  }
  if (kind === void 0 && cards.length > 5 && cards.length % 2 === 0) {
    // check StraightPair
    // 两张相同, 并且连续
    let ok = true
    for (let i = cards.length - 1; i > 1; i -= 2) {
      if (cards[i].value !== cards[i - 1].value
          || (i > 2 && cards[i].value - 1 !== cards[i - 2].value)) {
        ok = false
        break
      }
    }
    if (ok) {
      kind     = PlayKinds.StraightPair
      mainCard = cards[0]
    }
  }
  if (kind === void 0 && cards.length > 5 && cards.length % 3 === 0) {
    // check StraightThree
    // 三张相同, 并且连续
    let ok = true
    for (let i = cards.length - 1; i > 1; i -= 3) {
      if (cards[i].value !== cards[i - 2].value
          || (i > 2 && cards[i].value - 1 !== cards[i - 3].value)) {
        ok = false
      }
    }
    if (ok) {
      kind     = PlayKinds.StraightThree
      mainCard = cards[0]
    }
  }
  if (kind === void 0 && cards.length > 7 && cards.length % 4 === 0) {
    // check StraightThreeAndOne
    const size = cards.length / 4
    // 主牌比副牌多, 所以可以确定有一个区间内的牌一定是主牌
    // 最开始的与主牌相同的牌不一定是主牌, 比如 111 333 444 555, 甚至 1111 333 444 555 666
    // 主牌值一定连续
    // 主牌中间可能有副牌, 比如 1111 222 3333 4
    // 暂时用最笨的办法: 分离主牌牌型和副牌牌型, 再从主牌型中查找有可能的主牌
    let main = 0
    mainCard = void 0
    // tslint:disable-next-line:whitespace
    for (let i = cards.length - 1; i > 1;) {
      if (cards[i].value === cards[i - 2].value) {
        // 是主牌牌型
        if (!mainCard || mainCard.value - 1 === cards[i].value) {
          // 连续则增加
          mainCard = cards[i]
          if (++main === size) {
            // 主牌足够停止
            kind = PlayKinds.StraightThreeAndOne
            break
          }
        } else {
          // 不连续则重置
          mainCard = cards[i]
          main     = 0
        }
        // 三张相同忽略
        // 第四张可以相同, 但是视为副牌
        i -= 3
      } else {
        // 下一张
        i -= 1
      }
    }
  }
  if (kind === void 0 && cards.length > 9 && cards.length % 5 === 0) {
    // check StraightThreeAndTwo
    const size = cards.length / 5
    // 主牌和副牌值一定不同
    // 主牌连续, 中间没有副牌
    // 所以只要找到主牌
    // 但是可能有 1111 222 333 的情况
    // 还是先用笨办法
    // 相对 StraightThreeAndOne简单在于Three的牌只能是主牌, 主牌必需连续
    // 复杂在于副牌必需成对, 并且四张也是副牌
    let side = 0
    let main = 0
    mainCard = void 0
    // tslint:disable-next-line:whitespace
    for (let i = cards.length - 1; i > 1;) {
      if (i > 2 && cards[i].value === cards[i - 3].value) {
        // 四张相同必定是副牌
        side += 2
        i -= 4
      } else if (cards[i].value === cards[i - 2].value) {
        // 三张相同必定是主牌型
        if ((mainCard && mainCard.value - 1 !== cards[i].value) || main > size) {
          // 主牌不连续, 中止
          break
        }
        // 主牌量递增
        main += 1
        mainCard = cards[i]
        i -= 3
      } else if (cards[i].value === cards[i - 1].value) {
        // 两张相同为副牌
        side += 1
        i -= 2
      } else {
        // 单牌不过
        break
      }
    }
    if (side === main && side === size) {
      kind = PlayKinds.StraightThreeAndTwo
    }
  }
  if (kind === void 0 && cards.length === 6) {
    // check for FourAndTwo
    // 任意四张相同即可
    for (let i = 0; i < 3; i++) {
      if (cards[i].value === cards[i + 3].value) {
        kind     = PlayKinds.FourAndTwo
        mainCard = cards[i]
        break
      }
    }
  }
  if (kind === void 0 && cards.length === 8) {
    // check for FourAndTwoPair
    // 四张相同, 并且额外四张是两对(也可以是四张相同, 要反过来查)
    for (let i = cards.length - 1; i > 2; i -= 2) {
      if (cards[i].value === cards[i - 3].value
          && cards[(i - 2 + 8) % 8].value === cards[(i - 1 + 8) % 8].value
          && cards[(i + 1) % 8].value === cards[(i + 2) % 8].value) {
        kind     = PlayKinds.FourAndTwoPair
        mainCard = cards[i]
        break
      }
    }
  }
  if (kind === void 0) {
    kind     = PlayKinds.None
    mainCard = void 0
  }
  return { kind, mainCard, cards, seat }
}
