/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-03-23 18:39:45
 * @version 1.0.0
 * @desc Fake.ts
 */


import {
  SMap,
  createNMap,
  NMap,
  splice,
  createSMap,
  AnyFunc,
  array2map
} from '../shared/misc'
import { UniqueIdPool } from '../shared/UniqueIdPool'

export const ERR_NOT_FOUND_DATA   = 'ERR_NOT_FOUND_DATA'
export const ERR_NOT_FOUND_TABLE  = 'ERR_NOT_FOUND_TABLE'
export const ERR_USED_METHOD_NAME = 'ERR_USED_METHOD_NAME'
export const ERR_NOT_FOUND_INDEX  = 'ERR_NOT_FOUND_INDEX'
export const ERR_USED_TABLE_NAME  = 'ERR_USED_TABLE_NAME'
export const ERR_USED_UNIQUE_ID   = 'ERR_USED_UNIQUE_ID'

export interface FakeDoc {
  id?: number;
  pure?(scenario: string): this;
  pure?(...fields: string[]): this;
  pure?<T>(scenario: string): T;
  pure?<T>(...fields: string[]): T;
}

interface FakeTableMeta {
  readonly list: any[];
  readonly dict: NMap<any>;
  readonly dicts: SMap<SMap<any>>;
  readonly indexes: string[];
}

class FakeDatabase {
  private tables: SMap<FakeTableMeta>

  mount(table: string, indexes: string[]) {
    if (this.tables[table]) {
      throw new Error(ERR_USED_TABLE_NAME)
    }
    this.tables[table] = {
      list   : [],
      dict   : createNMap(),
      dicts  : createSMap(),
      indexes: indexes,
    }
    indexes.forEach((index) => {
      this.tables[table].dicts[index] = createSMap()
    })
    return this.tables[table]
  }

  get(table: string) {
    if (!this.tables[table]) {
      throw new Error(ERR_NOT_FOUND_TABLE)
    }
    return this.tables[table]
  }
}

const db = new FakeDatabase()

export class FakeTable<T extends FakeDoc> {
  readonly name: string
  readonly idPool = new UniqueIdPool
  private indexes: string[]
  private table: FakeTableMeta
  private methods = createSMap<AnyFunc<T>>()
  private scenarios: SMap<string[]>

  constructor(
    table: string,
    indexes: string[] = [],
    scenarios: SMap<string[]> = {},
    methods: SMap<AnyFunc<T>> = {},
  ) {
    this.table      = db.mount(table, indexes)
    this.name       = table
    this.indexes    = indexes
    this.scenarios  = scenarios
    const _this     = this
    methods['pure'] = methods['pure'] || function (this: T, ...fields: string[]): T {
        if (fields.length === 1 && scenarios[fields[0]]) {
          fields = scenarios[fields[0]]
        }
        const o: any = {}
        for (let i = 0; i < fields.length; i++) {
          o[fields[i]] = (<any>this)[fields[i]]
        }
        return _this.boundDoc(o, false, true)
      }
    for (let k in methods) {
      this.addMethod(k, methods[k])
    }
  }

  addMethod(key: string, func: AnyFunc<T>) {
    if (this.methods[key]) {
      throw new Error(ERR_USED_METHOD_NAME)
    }
    this.methods[key] = func
    return this
  }

  private boundDoc(doc: T, copy?: boolean): Promise<T>
  private boundDoc(doc: T, copy: boolean, sync: boolean): T
  private boundDoc(doc: T, copy = true, sync = false): T|Promise<T> {
    doc = copy ? Object.assign({}, this.methods, doc) : Object.assign(doc, this.methods)
    return sync ? doc : Promise.resolve(doc)
  }

  private pureDoc(doc: T, copy = true): T {
    copy && (doc = Object.assign({}, doc))
    Object.keys(doc).forEach((key) => {
      if ('function' === typeof (<any>doc)[key]) {
        delete (<any>doc)[key]
      }
    })
    return Object.freeze(doc)
  }

  private checkIndex(data: T) {
    let value: any
    for (let i = 0; i < this.indexes.length; i++) {
      value = (<any>data)[this.indexes[i]]
      if (value !== void 0) {
        if (typeof value !== 'string' && typeof value !== 'number') {
          return false
        }
        if (this.table.dicts[this.indexes[i]][value]
            && this.table.dicts[this.indexes[i]][value].id !== data.id) {
          return false
        }
      }
    }
    return true
  }

  private updateIndex(data: T, remove: boolean) {
    const id = data.id
    if (remove) {
      delete this.table.dict[id]
      this.indexes.forEach((index) => {
        const value: any = (<any>data)[index]
        if (value !== void 0) {
          delete this.table.dicts[index][value]
        }
      })
    } else {
      this.table.dict[id] = data
      this.indexes.forEach((index) => {
        const value: any = (<any>data)[index]
        if (value !== void 0) {
          this.table.dicts[index][value] = data
        }
      })
    }
  }

  add(doc: T): Promise<T> {
    doc.id === void 0 && (doc.id = this.idPool.alloc())
    doc = this.pureDoc(doc)
    if (this.table.dict[doc.id]) {
      return Promise.reject<T>(new Error(ERR_USED_UNIQUE_ID))
    }
    if (!this.checkIndex(doc)) {
      return Promise.reject<T>(new Error(ERR_USED_UNIQUE_ID))
    }
    this.table.list.push(doc)
    this.updateIndex(doc, false)
    return this.boundDoc(doc)
  }

  update(doc: T): Promise<T> {
    if (doc.id === void 0 || !this.table.dict[doc.id]) {
      return Promise.reject<T>(new Error(ERR_NOT_FOUND_DATA))
    }
    const old = this.table.dict[doc.id]
    this.updateIndex(old, true)
    splice(this.table.list, old)
    const _new = this.pureDoc(Object.assign({}, old, doc), false)
    if (!this.checkIndex(_new)) {
      return Promise.reject<T>(new Error(ERR_USED_UNIQUE_ID))
    }
    this.table.list.push(doc)
    this.updateIndex(_new, false)
    return this.boundDoc(_new)
  }

  find(id: number): Promise<T> {
    if (!this.table.dict[id]) {
      return Promise.reject<T>(new Error(ERR_NOT_FOUND_DATA))
    }
    return this.boundDoc(this.table.dict[id])
  }

  findByIndex(index: string, value: any): Promise<T> {
    if (!this.table.dicts[index]) {
      return Promise.reject<T>(new Error(ERR_NOT_FOUND_INDEX))
    }
    if (!this.table.dicts[index][value]) {
      return Promise.reject<T>(new Error(ERR_NOT_FOUND_DATA))
    }
    return this.boundDoc(this.table.dicts[index][value])
  }

  findMap(
    filter?: (item: T) => boolean,
    limit = Infinity,
    index = 'id',
  ): Promise<SMap<T>> {
    return this.findList(filter, limit).then((list) => array2map(list, index))
  }

  findList(filter?: (item: T) => boolean, limit = Infinity): Promise<T[]> {
    const out: T[] = []
    if (!filter) {
      out.push(...this.table.list.slice(-limit).reverse())
    } else {
      for (let i = this.table.list.length - 1; i >= 0; i--) {
        if (filter(this.table.list[i])) {
          out.push(this.table.list[i])
          if (out.length >= limit) {
            break
          }
        }
      }
    }
    return Promise.resolve(out.map((doc) => this.boundDoc(doc, true, true)))
  }

  remove(id: number): Promise<T> {
    const data = this.table.dict[id]
    if (!data) {
      return Promise.reject<T>(new Error(ERR_NOT_FOUND_DATA))
    }
    this.updateIndex(data, true)
    splice(this.table.list, data)
    return this.boundDoc(data)
  }
}
