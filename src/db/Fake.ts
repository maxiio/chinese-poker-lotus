/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:39:45
 * @version 1.0.0
 * @desc Fake.ts
 */


import { SMap, createNMap, NMap, splice, createSMap } from '../shared/utils'
import { UniqueIdPool } from '../shared/UniqueIdPool'

export interface FakeModel {
  id?: number;
}

export class Fake<T extends FakeModel> {
  private list: any[]          = []
  private dict: NMap<T>        = createNMap<T>()
  private idPool               = new UniqueIdPool
  private dicts: SMap<SMap<T>> = createSMap<SMap<T>>()

  private static nss: SMap<Fake<any>> = createSMap<Fake<any>>()

  static readonly NS: string

  static readonly UNIQUE_INDEXES: string[]

  static mount() {
    const ns: string        = (<any>this).NS
    const indexes: string[] = (<any>this).UNIQUE_INDEXES
    if (!ns) {
      throw new Error('Cannot mount a class without namespace')
    }
    const fake = new Fake
    if (indexes) {
      for (let i = 0; i < indexes.length; i++) {
        fake.dicts[indexes[i]] = createSMap()
      }
    }
    Fake.nss[ns] = fake
  }

  static ns(): Fake<any>
  static ns<R>(id: string): Fake<R>
  static ns(id: string = (this as any).NS): Fake<any> {
    return Fake.nss[id]
  }

  static find(id: number): Promise<any> {
    const fake = (this as any as typeof Fake).ns()
    const old  = fake.dict[id]
    return old ? Promise.resolve(old) : Promise.reject(new Error('Not Found!'))
  }

  static findByIndex(index: string, id: any): Promise<any> {
    const fake = (this as any as typeof Fake).ns()
    if (!fake.dicts[index] || !fake.dicts[index][id]) {
      return Promise.reject(new Error('Not Found'))
    }
    return Promise.resolve(fake.dicts[index][id])
  }

  static update(id: number, data: any): Promise<any> {
    const fake = (this as any as typeof Fake).ns()
    const old  = fake.dict[id]
    if (!old) { return Promise.reject(new Error('Not Found')) }
    Object.assign(old, data)
    splice(fake.list, old)
    fake.list.push(old)
    return Promise.resolve(old)
  }

  static add(data: any, id?: number): Promise<any> {
    const fake = (this as any as typeof Fake).ns()
    id === void 0 && (id = fake.idPool.alloc())
    fake.list.push(data)
    data.id       = id
    fake.dict[id] = data
    for (let index in fake.dicts) {
      const id = (<any>data)[index]
      if (id !== void 0) {
        fake.dicts[index][id] = data
      }
    }
    return Promise.resolve(data)
  }

  static remove(id: number): Promise<any> {
    const fake = (this as any as typeof Fake).ns()
    const old  = fake.dict[id]
    if (!old) { return Promise.reject(new Error('Not Found')) }
    splice(fake.list, old)
    delete fake.dict[id]
    return Promise.resolve(old)
  }

  static list(filter?: (item: any) => boolean, max = Infinity): Promise<any[]> {
    const fake = (this as any as typeof Fake).ns()
    if (!filter) { return Promise.resolve(fake.list.slice(-max).reverse()) }
    const out: any[] = []
    for (let i = fake.list.length - 1; i >= 0; i--) {
      if (filter(fake.list[i])) {
        out.push(fake.list[i])
        if (out.length >= max) {
          break
        }
      }
    }
    return Promise.resolve(out)
  }
}


export function fake(Ctor: typeof Fake): typeof Ctor {
  Ctor.mount()
  return Ctor
}
