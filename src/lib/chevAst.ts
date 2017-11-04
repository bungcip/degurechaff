import * as cp from './chevParser'
import * as dt from './dt'
import { Token } from 'chevrotain'

export class Root {
    constructor(public pairs: Pair[], public tables: Table[], public arrayOfTables: ArrayOfTable[]) {}
}

export class Table {
    constructor(public name: Name, public pairs: Pair[]) {}
}

export class ArrayOfTable extends Table { }

export class Name {
    constructor(public segments: string[]) {}
}

export class Pair {
    constructor(public key: string, public value: Value) { }
}

/// atomic value kind
export const enum AtomicValueKind {
    Boolean,
    String,
    Integer,
    Float,
    Date,
    InlineTable,
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
}

/**
 * Value which cannot contain other value
 */
export class AtomicValue implements Value {
    constructor(public kind: AtomicValueKind, public content: string | boolean | number | dt.Date | dt.DateTime | dt.Time) {}

    jsValue(): string | boolean | number {
        if (this.content instanceof dt.Date || this.content instanceof dt.DateTime || this.content instanceof dt.Time) {
            return this.content.toString()
        }

        return this.content
    }

    /// return key representation
    toString(): string {
        return this.content.toString()
    }
}

/**
 * ArrayValue class contains other value node
 */
export class ArrayValue implements Value {
    constructor(public items: Value[]) { }

    jsValue(): Array<any> {
        return this.items.map( x => x.jsValue() )
    }
}

export class InlineTableValue implements Value {
    constructor(public pairs: Pair[]) { }

    jsValue(): JsObject {
        let result: JsObject = {}
        for (const pair of this.pairs) {
            const key = pair.key.toString()
            const value = pair.value.jsValue()
            result[key] = value
        }
        return result
    }
}
