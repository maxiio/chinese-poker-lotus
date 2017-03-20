/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-18 01:44:03
 * @version 1.0.0
 * @desc Log.ts
 */


import { createSMap, format } from './utils'


export enum LogLevels {
  Debug   = 1,
  Log     = 2,
  Notice  = 3,
  Warning = 4,
  Error   = 5,
}

const LOG_NAMES = createSMap<string>(<any>LogLevels)

export class Log {
  private static instances = createSMap<Log>()

  get(id: string) {
    if (!this.instances[id]) {
      this.instances[id] = new Log(id)
    }
    return this.instances[id]
  }

  constructor(
    private id: string,
    private level = process.env.NODE_ENV === 'development'
      ? LogLevels.Debug
      : LogLevels.Log,
    private stdout = process.stdout,
    private stderr = process.stderr,
  ) {}

  private write(stderr: boolean, level: LogLevels, fmt: any, ...param: any[]) {
    if (this.level > level) { return this }
    const target = stderr ? this.stderr : this.stdout
    const date   = new Date
    const msg    = format(fmt, ...param)
    target.write(`[${this.id} ${LOG_NAMES[level]} ${date.toLocaleDateString()} ${date.toLocaleTimeString()}] ${msg}\n`)
    return this
  }

  error(fmt: any, ...param: any[]) {
    return this.write(true, LogLevels.Error, fmt, ...param)
  }

  warning(fmt: any, ...param: any[]) {
    return this.write(false, LogLevels.Warning, fmt, ...param)
  }

  notice(fmt: any, ...param: any[]) {
    return this.write(false, LogLevels.Notice, fmt, ...param)
  }

  log(fmt: any, ...param: any[]) {
    return this.write(false, LogLevels.Log, fmt, ...param)
  }

  debug(fmt: any, ...param: any[]) {
    return this.write(false, LogLevels.Debug, fmt, ...param)
  }
}
