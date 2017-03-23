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
import WritableStream = NodeJS.WritableStream


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

  static get(
    id: string,
    level?: LogLevels,
    stdout?: WritableStream,
    stderr?: WritableStream,
  ) {
    if (!Log.instances[id]) {
      Log.instances[id] = new Log(id, level, stdout, stderr)
    }
    return Log.instances[id]
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
    target.write(`[${this.id} ${date.toLocaleDateString()} ${date.toLocaleTimeString()} ${LOG_NAMES[level]}] ${msg}\n`)
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
