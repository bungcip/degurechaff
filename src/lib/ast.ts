import {Token, TokenType, SourcePosition} from './lexer'

export class Node {

}

export class Root {
    public pairs: Pair[]
    public tables: Table[]
    constructor(){
        this.pairs = []
        this.tables = []
    }
}

export class Table {
    public name: Name
    public pairs: Pair[]
    constructor(){
        this.pairs = []
    }
}

export class Name {
    public segments: Token[]
    constructor(segments: Token[]){
        this.segments = segments
    }
}

export class Pair {
    constructor(public key: Key, public value: Value){}
}

/// get content between quote
function extractStringBetweenQuote(input: string): string{
    return input.slice(1, input.length - 1)
}

export class Key {
    constructor(public content: Token){}

    /// return key representation in string
    toString(): string {
        if(this.content.type == TokenType.Identifier){
            return this.content.value
        }else if(this.content.type == TokenType.BasicString){
            return extractStringBetweenQuote(this.content.value as string)
        }

        throw "Key: not yet implemented"
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
                const data = (this.content.value as string)
                return data.slice(1, data.length - 1)
            case TokenType.Integer:
            case TokenType.Identifier:
                return this.content.value
            default:
                throw "Value: not yet implemented"
        }
    }
}