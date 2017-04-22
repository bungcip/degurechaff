/**
 *  new token, lexer & parser implementation using chevrotain
 */
import {
    Lexer,
    Parser,
    Token,
    EOF
} from "chevrotain"


const signFragment = /(-|\+)?/
const integerFragment = /(0|[1-9](\d|_)*)/
const expFragment = /([eE][+-]?\d+)?/
class Float extends Token {
    // static PATTERN = /(-|\+)?(0|[1-9](\d|_)*)(\.(0|[1-9])(\d|_)*)?([eE][+-]?\d+)?/
    static PATTERN = new RegExp([
        signFragment,
        integerFragment, 
        /\./,
        integerFragment,
        expFragment
    ].map(x => x.source).join(''))
}

class Integer extends Token {
    static PATTERN = new RegExp([
        signFragment,
        integerFragment, 
    ].map(x => x.source).join(''))
    static LONGER_ALT = Float
}



class BasicString extends Token { static PATTERN = /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/ }
class MultiLineBasicString extends Token { static PATTERN = /"""(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"""/ }

class LiteralString extends Token { static PATTERN = /'(:?[^\\'])*'/ }
class MultiLineLiteralString extends Token { static PATTERN = /'''[\s\S]*?'''/ }


class Identifier extends Token { static PATTERN = /[a-zA-Z0-9_\-]+/ }

class True extends Token {
    static PATTERN = "true"
    static LONGER_ALT = Identifier
}
class False extends Token {
    static PATTERN = "false"
    static LONGER_ALT = Identifier
}


class LeftBracket extends Token { static PATTERN = "[" }
class RightBracket extends Token { static PATTERN = "]" }
class LeftCurly extends Token { static PATTERN = "{" }
class RightCurly extends Token { static PATTERN = "}" }
class LeftParen extends Token { static PATTERN = "(" }
class RightParen extends Token { static PATTERN = ")" }

class Comma extends Token { static PATTERN = "," }
class Colon extends Token { static PATTERN = ":" }
class Dot extends Token { static PATTERN = "." }
class Equal extends Token { static PATTERN = "=" }

const dateFragment = /\d{4}-\d{2}-\d{2}/
const timeFragment = /\d{2}:\d{2}:\d{2}(\.\d+)?/
const tzFragment   = /(Z|([+-]\d{2}:\d{2}))?/

class DateTime extends Token { 
    static PATTERN = new RegExp([
        dateFragment,
        /T/,
        timeFragment,
        tzFragment
    ].map(x => x.source).join(''))
}

class Date extends Token {
    static PATTERN = dateFragment
    static LONGER_ALT = DateTime
}

class Time extends Token {
    static PATTERN = timeFragment
}


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

    MultiLineBasicString,
    BasicString, 
    
    MultiLineLiteralString,
    LiteralString,

    Date, Time,

    Integer,
    True, False,
    Identifier,

    LeftBracket, RightBracket,
    LeftCurly, RightCurly,
    Comma, Colon, Dot, Equal,

    Comment,

    /// Longer Alternative Token
    Float,
    DateTime,
]

export const TomlLexer = new Lexer(allTokens)

export class TomlParser extends Parser {
    constructor(input: Token[]) {
        super(input, allTokens, {outputCst: true})
        Parser.performSelfAnalysis(this)
    }

    public root = this.RULE("root", () => {
        let once = false
        this.MANY({
            GATE: () => {
                return this.isAtEndOfInput() == false
            },
            DEF: () => {
                this.OR([
                    { ALT: () => this.SUBRULE(this.arrayOfTable) },
                    { ALT: () => this.SUBRULE(this.table) },
                    { GATE: () => once == false, ALT: () => {
                        this.SUBRULE(this.pairs)
                        once = true
                    }},
                ])
            }
        })

        // this.OPTION(() => this.SUBRULE(this.pairs))
        // this.OR([
        //     { ALT: () => this.SUBRULE(this.table) },
        //     { ALT: () => this.SUBRULE(this.arrayOfTable) },
        // ])

        /// FIXME: perlu MANY
        // this.OR([
        //     { ALT: () => this.SUBRULE(this.arrayOfTable) },
        //     { ALT: () => this.SUBRULE(this.table) },
        //     { ALT: () => this.SUBRULE(this.pairs) },
        // ])
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
        this.AT_LEAST_ONE_SEP({
            SEP: Dot,
            DEF: () => { this.SUBRULE(this.tableNameSegment) }
        })
    })

    private tableNameSegment = this.RULE("tableNameSegment", () => {
        this.OR([
            { ALT: () => this.CONSUME(Identifier) },
            { ALT: () => this.CONSUME(Integer) },
            /// need to split result between dot
            { ALT: () => this.CONSUME(Float) },

            { ALT: () => this.CONSUME(BasicString) },
            { ALT: () => this.CONSUME(LiteralString) },
            { ALT: () => this.SUBRULE(this.boolValue) },
        ])        
    })

    private pairs = this.RULE("pairs", () => {
        // this.MANY(() => this.SUBRULE(this.pair))
        this.MANY(() => this.OR1([
            { ALT: () => { this.CONSUME1(NewLine) } },
            { ALT: () => {
                this.SUBRULE(this.pair)
                this.OR2([
                    { ALT: () => this.CONSUME2(NewLine) },
                    { ALT: () => this.CONSUME3(EOF) },
                ])
            }},
        ]))
    })

    private pair = this.RULE("pair", () => {
        this.SUBRULE(this.key)
        this.CONSUME(Equal)
        this.SUBRULE(this.value)
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
            { ALT: () => this.SUBRULE(this.arrayValue) },
            { ALT: () => this.SUBRULE(this.inlineTableValue) },
            { ALT: () => this.SUBRULE(this.dateValue) },
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
            { ALT: () => this.CONSUME(MultiLineBasicString) },
            { ALT: () => this.CONSUME(MultiLineLiteralString) },
        ])
    })

    private numberValue = this.RULE("numberValue", () => {
        this.OR([
            { ALT: () => this.CONSUME(Integer) },
            { ALT: () => this.CONSUME(Float) },
        ])
    })

    private dateValue = this.RULE("dateValue", () => {
        this.OR([
            { ALT: () => this.CONSUME(Date) },
            { ALT: () => this.CONSUME(Time) },
            { ALT: () => this.CONSUME(DateTime) },
        ])
    })

    private arrayValue = this.RULE("arrayValue", () => {
        this.CONSUME(LeftBracket)

        let hasComma: boolean = true
        this.MANY({
            GATE: () => hasComma === true,
            DEF: () => {
                this.SUBRULE(this.value)
                hasComma = this.OPTION(() => {
                    this.CONSUME(Comma)
                    return true
                })
            }
        })

        // this.MANY_SEP({
        //     SEP: Comma,
        //     DEF: () => this.SUBRULE(this.value)
        // })


        this.CONSUME(RightBracket)
    })

    private inlineTableValue = this.RULE("inlineTableValue", () => {
        this.CONSUME(LeftCurly)

        let hasComma: boolean = true
        this.MANY({
            GATE: () => hasComma === true,
            DEF: () => {
                this.SUBRULE(this.pair)
                hasComma = this.OPTION(() => {
                    this.CONSUME(Comma)
                    return true
                })
            }
        })

        this.CONSUME(RightCurly)
    })

}

export const parser = new TomlParser([])