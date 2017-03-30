/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 16:53:29
 * @version 1.0.0
 * @desc index.ts
 */


import { Responser, ReservedResults, ActionFunc } from '../../socket/types'
import { CMD_GAME_SIGN_IN } from './constants'
import { NMap, SMap, AnyFunc } from '../../shared/misc'


function onClose() {
}

function signIn(man: Responser) {
  man.setResult(ReservedResults.NotImplemented).send()
}

export const listeners: SMap<AnyFunc<void>[]> = {
  close: [onClose],
}

export const actions: NMap<ActionFunc> = {
  [CMD_GAME_SIGN_IN]: signIn,
}
