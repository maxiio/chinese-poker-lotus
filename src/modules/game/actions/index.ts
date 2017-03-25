/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc index.ts
 */


import {
  Responser,
  MessageEncodings,
  ReservedResults,
  ActionFunc
} from '../../../socket/types'
import {
  CMD_GAME_ADD,
  CMD_GAME_JOIN,
  CMD_GAME_READY,
  CMD_GAME_FIGHT,
  CMD_GAME_PLAY,
  CMD_GAME_LEAVE
} from '../constants'
import { GameService } from '../service'
import { inEnum, NMap } from '../../../shared/misc'
import { Seats } from '../../../poker/types'

function add(man: Responser) {
  GameService.add().then((game) => {
    man.send(game, MessageEncodings.Json)
  }, (err) => {
    man.setResult(ReservedResults.InternalError)
      .send(err, MessageEncodings.String)
  })
}

function join(man: Responser) {
  const { id, seat } = man.request.data || {} as any
  if (!id || (seat !== void 0 && !inEnum(seat, Seats))) {
    man.setResult(ReservedResults.BadRequest).send()
    return
  }
  GameService.join(id, man.from, seat).then((game) => {
    man.send(game, MessageEncodings.Json)
  }, (err) => {
    man.setResult(ReservedResults.InternalError).send(err, MessageEncodings.Json)
  })
}

function ready(man: Responser) {
  GameService.ready(man.from).then((game) => {
    man.send(game, MessageEncodings.Json)
  }, (err) => {
    man.setResult(ReservedResults.InternalError).send(err, MessageEncodings.Json)
  })
}

function fight(man: Responser) {
  const { value, action } = man.request.data || {} as any
  GameService.fight(man.from, action, value).then((action) => {
    man.send(action, MessageEncodings.Json)
  }, (err) => {
    man.setResult(ReservedResults.InternalError).send(err, MessageEncodings.Json)
  })
}

function play(man: Responser) {
  const { cards, action } = man.request.data || {} as any
  GameService.play(man.from, action, cards).then((action) => {
    man.send(action, MessageEncodings.Json)
  }, (err) => {
    man.setResult(ReservedResults.InternalError).send(err, MessageEncodings.Json)
  })
}

function leave(man: Responser) {
  GameService.leave(man.from).then(() => {
    man.send()
  }, (err) => {
    man.setResult(ReservedResults.InternalError).send(err, MessageEncodings.Json)
  })
}

export const actions: NMap<ActionFunc> = {
  [CMD_GAME_ADD]  : add,
  [CMD_GAME_JOIN] : join,
  [CMD_GAME_READY]: ready,
  [CMD_GAME_FIGHT]: fight,
  [CMD_GAME_PLAY] : play,
  [CMD_GAME_LEAVE]: leave,
}
