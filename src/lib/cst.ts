/// Concrete Syntax Tree
import * as dt from './dt'
import { Token } from './token'

export const enum Type {
  Root,
  Table,
  ArrayOfTable,
  Pair,
  Key,
  Value, /// ~~ NOTE: tidak terpakai?

  /// Value
  Atomic,
  Array,
  InlineTable,

  /// Table Name
  Name,

  Error /// Error Node
}

export type TokenIndex = number
export type NodeChildren = (Node | TokenIndex | Token)[] | Map<Type, Node[]>

/// CST Node
export class Node {
  // type: Type,
  // spanBegin: TokenIndex,
  // spanEnd: TokenIndex,

  constructor(
    public type: Type,
    public begin: TokenIndex,
    public end: TokenIndex,
    public children: NodeChildren
  ) {}
}

export class AtomicNode extends Node {
  public kind: AtomicValueKind

  constructor(type: Type, begin: TokenIndex, end: TokenIndex, kind: AtomicValueKind) {
    super(type, begin, end, [end])
    this.kind = kind
  }
}

export class Root {
  constructor(public pairs: Pair[], public tables: Table[], public arrayOfTables: ArrayOfTable[]) {}
}

export class Table {
  constructor(public name: Name, public pairs: Pair[]) {}
}

export class ArrayOfTable extends Table {}

export class Name {
  constructor(public segments: Token[]) {}
  isEqual(other: Name): boolean {
    if (this.segments.length !== other.segments.length) {
      return false
    }

    for (const index in this.segments) {
      if (this.segments[index] !== other.segments[index]) {
        return false
      }
    }

    return true
  }
}

export class Pair {
  constructor(public key: Key, public value: Value) {}
}

export class Key {
  constructor(public name: Token) {}
}

/// atomic value kind
export const enum AtomicValueKind {
  Boolean,
  String,
  Integer,
  Float,
  Date
}

/**
 * JsObject is type of object which only contain value which can be representate with
 * js primitive data type
 */
export interface JsObject {
  [key: string]: JsValue
}

export type JsValue = string | number | boolean | JsObject | Array<any>

export interface Value {
  toString(): string
  jsValue(): JsObject | string | boolean | number | Array<any>
  typename(): string
}

/**
 * Value which cannot contain other value
 */
export class AtomicValue implements Value {
  constructor(public kind: AtomicValueKind, public content: Token) {}

  jsValue(): string | boolean | number {
    const v = this.content.value()
    if (v instanceof dt.Date || v instanceof dt.DateTime || v instanceof dt.Time) {
      return this.content.toString()
    }

    return v
  }

  /// return key representation
  toString(): string {
    return this.content.toString()
  }

  typename(): string {
    switch (this.kind) {
      case AtomicValueKind.Boolean:
        return 'boolean'
      case AtomicValueKind.Date:
        return 'date'
      case AtomicValueKind.Float:
        return 'float'
      case AtomicValueKind.Integer:
        return 'integer'
      case AtomicValueKind.String:
        return 'string'
    }

    return '-'
  }
}

/**
 * ArrayValue class contains other value node
 */
export class ArrayValue implements Value {
  constructor(public items: Value[]) {}

  jsValue(): Array<any> {
    return this.items.map(x => x.jsValue())
  }

  typename(): string {
    return `array`
  }
}

export class InlineTableValue implements Value {
  constructor(public pairs: Pair[]) {}

  jsValue(): JsObject {
    let result: JsObject = {}
    for (const pair of this.pairs) {
      const key = pair.key.toString()
      const value = pair.value.jsValue()
      result[key] = value
    }
    return result
  }

  typename(): string {
    return 'inline table'
  }
}
