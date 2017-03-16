/**
 *  new token, lexer & parser implementation using chevrotain
 */
import {
    Lexer,
    Parser,
    Token,
    ISimpleTokenOrIToken,
    EOF
} from "chevrotain"

// Using TypeScript we have both classes and static properties to define Tokens
class Float extends Token {
    static PATTERN = /(-|\+)?(0|[1-9](\d|_)*)(\.(0|[1-9])(\d|_)*)?([eE][+-]?\d+)?/
}

class Integer extends Token {
    static PATTERN = /(-|\+)?(0|[1-9](\d|_)*)/
    static LONGER_ALT = Float
}

class BasicString extends Token { static PATTERN = /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/ }

class LiteralString extends Token { static PATTERN = /'(:?[^\\'])*'/ }
class MultiLineLiteralString extends Token { static PATTERN = /'''/ }


class Identifier extends Token { static PATTERN = /[a-zA-Z0-9_\-]+/ }

class True extends Token {
    static PATTERN = /true/
    static LONGER_ALT = Identifier
}
class False extends Token {
    static PATTERN = /false/
    static LONGER_ALT = Identifier
}


class LeftBracket extends Token { static PATTERN = /\[/ }
class RightBracket extends Token { static PATTERN = /]/ }
class LeftCurly extends Token { static PATTERN = /{/ }
class RightCurly extends Token { static PATTERN = /}/ }
class LeftParen extends Token { static PATTERN = /\(/ }
class RightParen extends Token { static PATTERN = /\)/ }

class Comma extends Token { static PATTERN = /,/ }
class Colon extends Token { static PATTERN = /:/ }
class Dot extends Token { static PATTERN = /\./ }
class Equal extends Token { static PATTERN = /=/ }

class DateTime extends Token { static PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/ }
class Date extends Token {
    static PATTERN = /\d{4}-\d{2}-\d{2}/
    static LONGER_ALT = DateTime
}
class Time extends Token { static PATTERN = /\d{2}:\d{2}:\d{2}\.\d+/ }


class Comment extends Token {
    static PATTERN = /#[^\n]+/
    static GROUP = Lexer.SKIPPED
}

class NewLine extends Token {
    static PATTERN = /(\r\n|\n)/
}

class WhiteSpace extends Token {
    static PATTERN = /[ \t]+/
    static GROUP = Lexer.SKIPPED
}

const allTokens = [
    WhiteSpace,
    NewLine,

    BasicString, LiteralString,

    Integer,
    True, False,
    Identifier,

    LeftBracket, RightBracket,
    LeftCurly, RightCurly,
    Comma, Colon, Dot, Equal,

    Date, 
    Time,

    Comment,

    /// Longer Alternative Token
    Float, 
    DateTime,
]

export const TomlLexer = new Lexer(allTokens)

export class TomlParser extends Parser {
    constructor(input: ISimpleTokenOrIToken[]) {
        super(input, allTokens)
        Parser.performSelfAnalysis(this)
    }

    public toml = this.RULE("toml", () => {
        this.OR([
            // using ES6 Arrow functions to reduce verbosity.
            { ALT: () => this.SUBRULE(this.table) },
            { ALT: () => this.SUBRULE(this.arrayOfTable) },
            { ALT: () => this.SUBRULE(this.pairs) }
        ])
    })

    private table = this.RULE("table", () => {
        this.CONSUME(LeftBracket)
        this.SUBRULE(this.tableName)
        this.CONSUME(RightBracket)

        this.SUBRULE(this.tableBody)
    })

    private tableBody = this.RULE("tableBody", () => {
        this.OPTION(() => {
            this.CONSUME(NewLine)
            this.SUBRULE(this.pairs)
        })
    })

    private arrayOfTable = this.RULE("arrayOfTable", () => {
        this.CONSUME1(LeftBracket)
        this.CONSUME2(LeftBracket)

        this.SUBRULE(this.tableName)

        this.CONSUME1(RightBracket)
        this.CONSUME2(RightBracket)

        this.SUBRULE(this.tableBody)
    })

    private tableName = this.RULE("tableName", () => {
        this.AT_LEAST_ONE_SEP(Dot, () => this.OR([
            { ALT: () => this.CONSUME(Identifier) },
            { ALT: () => this.CONSUME(Integer) },
            /// need to split result between dot
            { ALT: () => this.CONSUME(Float) },

            { ALT: () => this.CONSUME(BasicString) },
            { ALT: () => this.CONSUME(LiteralString) },
            { ALT: () => this.SUBRULE(this.boolValue) },
        ]))
    })

    private pairs = this.RULE("pairs", () => {
        // this.MANY(() => this.SUBRULE(this.pair))
        this.MANY(() => this.OR([
            { ALT: () => this.SUBRULE(this.blankPair) },
            { ALT: () => this.SUBRULE(this.pair) },
        ]))
    })

    private pair = this.RULE("pair", () => {
        this.SUBRULE(this.key)
        this.CONSUME(Equal)
        this.SUBRULE(this.value)
        this.OR([
            { ALT: () => this.CONSUME(NewLine) },
            { ALT: () => this.CONSUME(EOF) },
        ])
    })

    private blankPair = this.RULE("blankPair", () => {
        this.CONSUME(NewLine)
    })

    private key = this.RULE("key", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.stringValue) },

            { ALT: () => this.CONSUME(Integer) },
            { ALT: () => this.CONSUME(Identifier) },

            { ALT: () => this.SUBRULE(this.boolValue) },
        ])
    })

    private value = this.RULE("value", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.stringValue) },
            { ALT: () => this.SUBRULE(this.numberValue) },
            { ALT: () => this.SUBRULE(this.boolValue) },
        ])
    })

    private boolValue = this.RULE("boolValue", () => {
        this.OR([
            { ALT: () => this.CONSUME(True) },
            { ALT: () => this.CONSUME(False) },
        ])
    })

    private stringValue = this.RULE("stringValue", () => {
        this.OR([
            { ALT: () => this.CONSUME(BasicString) },
            { ALT: () => this.CONSUME(LiteralString) },
        ])
    })

    private numberValue = this.RULE("numberValue", () => {
        this.OR([
            { ALT: () => this.CONSUME(Integer) },
            { ALT: () => this.CONSUME(Float) },
        ])
    })

}