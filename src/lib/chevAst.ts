import * as cp from './chevParser'
import * as dt from './dt'

export class Root {
    constructor(public pairs: Pair[], public tables: Table[], public arrayOfTables: ArrayOfTable[]) {}
}

export class Table {
    constructor(public name: Name, public pairs: Pair[]) {}
}

export class ArrayOfTable extends Table { }

export class Name {
    constructor(public segments: string[]) {}
    isEqual(other: Name): boolean {
        if(this.segments.length !== other.segments.length){
            return false
        }

        for(const index in this.segments){
            if(this.segments[index] !== other.segments[index]){
                return false
            }
        }

        return true
    }
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

    typename(): string {
        switch(this.kind) {
            case AtomicValueKind.Boolean: return 'boolean'
            case AtomicValueKind.Date: return 'date'
            case AtomicValueKind.Float: return 'float'
            case AtomicValueKind.Integer: return 'integer'
            case AtomicValueKind.String: return 'string'
        }

        return '-'
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

    typename(): string {
        return `array`
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

    typename(): string {
        return 'inline table'
    }
}
