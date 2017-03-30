/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-28 17:47:31
 * @version 1.0.0
 * @desc misc.ts
 */


async function hello() {
  try {
    const d = await Promise.reject(new Error('Always'))
    console.log('d', d)
  } catch (e) {
    console.log('error', e)
  }
}

hello()
