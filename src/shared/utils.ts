/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-11 00:36:03
 * @version 1.0.0
 * @desc utils.ts
 */
import util = require('util')
import { INT32_MAX_VALUE } from './constants'

export interface SMap<T> {
  [key: string]: T;
}

export interface NMap<T> {
  [key: number]: T;
}

export function createSMap<T>(initial?: SMap<T>): SMap<T> {
  const map: SMap<T> = {}
  map['__']          = void 0
  delete map['__']
  if (initial) {
    for (let i in initial) {
      map[i] = initial[i]
    }
  }
  return map
}

export function createNMap<T>(initial?: NMap<T>): NMap<T> {
  const map: NMap<T> = {}
  map[NaN]           = void 0
  delete map[NaN]
  if (initial) {
    for (let i in initial) {
      map[i] = initial[i]
    }
  }
  return map
}

export function splice<T>(data: T[], item: T, ...items: T[]): T[] {
  let index: number
  while (~(index = data.indexOf(item))) {
    data.splice(index, 1, ...items)
  }
  return data
}

export function random(min = 0, max = INT32_MAX_VALUE, float = false) {
  const factor = Math.random()
  if (float) {
    return min + factor * (max - min)
  }
  return min + Math.floor(factor * (max - min + 1))
}

export function inEnum(value: number, enums: any) {
  return typeof value === 'number' && !!enums[value]
}

if (!module.parent) {
  for (let max = 2; max < 10; max++) {
    const data: number[] = []
    for (let i = 0; i < 10; i++) {
      data.push(random(1, max))
    }
    console.log(data)
  }
}

export function noop() {}


const CIRCULAR_ERROR_MESSAGE = 'Converting circular structure to JSON'


function tryStringify(arg: any) {
  try {
    return JSON.stringify(arg)
  } catch (err) {
    if (err.name === 'TypeError' && err.message === CIRCULAR_ERROR_MESSAGE) {
      return '[Circular]'
    }
    throw err
  }
}


/**
 *
 * @param fmt
 * @param params
 * @return {string}
 *
 * %% => %
 * %s =>
 */
export function format(fmt: any, ...params: any[]) {
  if (typeof fmt !== 'string') {
    return util.format(fmt, ...params)
  }
  let ret = ''
  let pos = 0
  let i   = 0
  let max = fmt.length - 1
  while (i < max && pos < params.length) {
    if (fmt[i] !== '%') {
      ret += fmt[i]
      i += 1
      continue
    }
    i += 1
    switch (fmt[i]) {
      case 's':
        ret += String(params[pos++])
        break
      case 'j':
        ret += tryStringify(params[pos++])
        break
      case '%':
        ret += '%'
        break
      case 'd':
        ret += Number(params[pos++]).toString()
        break
      case 'h':
        ret += '0x' + Number(params[pos++]).toString(16).toLowerCase()
        break
      case 'H':
        ret += '0x' + Number(params[pos++]).toString(16).toUpperCase()
        break
      case 'b':
        ret += '0b' + Number(params[pos++]).toString(2)
        break
      default:
        ret += '%' + fmt[i]
        break
    }
    i += 1
  }
  ret += fmt.slice(i).replace(/%%/g, '%')
  for (let value: any; pos < params.length; pos++) {
    value = params[pos]
    if (value === null || (typeof value !== 'object' && typeof value !== 'symbol')) {
      ret += ' ' + value
    } else {
      ret += ' ' + util.inspect(value)
    }
  }
  return ret
}

if (!module.parent) {
  console.log(format('%%: hello: %s, kind<%H>, sm<%h>, normal<%d>, JSON: %j, %%,'
                     + ' %unknown, %d too much',
    true,
    123,
    123,
    123,
    { abc: 123 }))
  console.log(format('abc %%, %s', 'hello', { a: 1 }, [1, 2]))
}
