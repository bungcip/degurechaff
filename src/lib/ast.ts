import {Token, TokenType, SourcePosition} from './lexer'

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
        let value = this.content.jsValue()
        return value.toString()
    }
}


export const enum ValueKind {
    Boolean,
    String,
    Integer,
    Float,
    Array,
    Date
}

export class Value {
    constructor(public kind: ValueKind, public content: Token){}

    /// return key represantation
    toString(): string {
        switch(this.content.type){
            case TokenType.BasicString:
            case TokenType.LiteralString:
                /// only need string value
                const data = (this.content.data as string)
                return data.slice(1, data.length - 1)
            case TokenType.Integer:
            case TokenType.Identifier:
                return this.content.data
            default:
                throw "Value::toString() not yet implemented"
        }
    }

    /// return a javascript type which represent the value
    jsValue(): string | number | Date | boolean {
        switch(this.kind){
            case ValueKind.Integer:
            case ValueKind.Float:
            case ValueKind.String:
                return this.content.jsValue()
            case ValueKind.Boolean:
                if( this.content.jsValue() === 'true'){
                    return true
                }else{
                    return false
                }
            default:
                throw "Value::jsValue(): not yet implemented"
        }
    }
}

