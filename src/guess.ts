/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-11 00:36:03
 * @version 1.0.0
 * @desc guess.ts
 */


export function guess(history: number[], controller: (x: number) => number) {
  // TODO
  return history.pop() > 0 ? controller(history.pop()) : 0
}
