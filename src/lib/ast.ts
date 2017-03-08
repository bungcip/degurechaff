import {Token, TokenType, SourcePosition} from './token'
import * as dt from './dt'

export class Node {

}

export class Root {
    public pairs: Pair[]
    public tables: Table[]
    public arrayOfTables: ArrayOfTable[]
    constructor(){
        this.pairs = []
        this.tables = []
        this.arrayOfTables = []
    }
}

export class Table {
    public name: Name
    public pairs: Pair[]
    constructor(){
        this.pairs = []
    }
}

export class ArrayOfTable extends Table {}

export class Name {
    public segments: Token[]
    constructor(segments: Token[]){
        this.segments = segments
    }
}

export class Pair {
    constructor(public key: Key, public value: Value){}
}

export class Key {
    constructor(public content: Token){}

    /// return key representation in string
    toString(): string {
        const value = this.content.value()
        return value.toString()
    }
}

/// atomic value kind
export const enum ValueKind {
    Boolean,
    String,
    Integer,
    Float,
    Date
}


export class Value {
    toString(): string {
        return ""
    }

    jsValue(): any {
        return ""
    }
}

/**
 * Value which cannot contain other value
 */
export class AtomicValue extends Value {
    constructor(public kind: ValueKind, public content: Token){
        super()
    }

    /// return key represantation
    toString(): string {
        let jsValue = this.jsValue()
        return jsValue.toString()

        // switch(this.content.type){
        //     case TokenType.BasicString:
        //     case TokenType.LiteralString:
        //         /// only need string value
        //         const data = (this.content.data as string)
        //         return data.slice(1, data.length - 1)
        //     case TokenType.Integer:
        //     case TokenType.Identifier:
        //         return this.content.data
        //     case TokenType.Date
        //     default:
        //         throw "Value::toString() not yet implemented"
        // }
    }

    /// return a javascript type which represent the value
    /// any TOML type which cannot be represent in JSON type is automatically
    /// converted to string
    jsValue(): string | number | boolean  {
        switch(this.kind){
            case ValueKind.Integer:
            case ValueKind.Float:
            case ValueKind.String:
                return this.content.value() as string | number
            case ValueKind.Date:
                const date = this.content.value()
                return date.toString()
            case ValueKind.Boolean:
                if( this.content.value() === 'true'){
                    return true
                }else{
                    return false
                }
        }
    }
}

/**
 * ArrayValue class contains other value node
 */
export class ArrayValue extends Value {
    constructor(public items: Value[]){
        super()
    }

    jsValue(): any {
        let result: any[] = []
        for(let item of this.items){
            result.push(item.jsValue())
        }

        return result
    }
}

export class InlineTableValue extends Value {
    constructor(public pairs: Pair[]){
        super()
    }

    jsValue(): any {
        let result = {}
        for(const pair of this.pairs){
            const key = pair.key.toString()
            const value = pair.value.jsValue()
            result[key] = value
        }
        return result
    }
}
