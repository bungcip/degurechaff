type Char = string

export const enum TokenType {
    Invalid,
    EndOfFile,
    
    Comment,

    Integer,
    Float,

    Identifier,

    STRING,
    WHITESPACE,
    NEWLINE,
    // operators and punctuation
    HASH,
    COMMA,
    COLON,
    SEMICOLON,
    Q_MARK,
    AT,
    DOT,
    L_PAREN,
    R_PAREN,
    L_BRACKET,
    R_BRACKET,
    L_CURLY,
    R_CURLY,
    IS,
    ISNT,
    MATCH,
    MATCHNOT,
    LT,
    LTE,
    GT,
    GTE,
    ADD,
    SUB,
    CAT,
    MUL,
    DIV,
    MOD,
    LSHIFT,
    RSHIFT,
    BITOR,
    BITAND,
    BITXOR,
    NOT,
    INC,
    DEC,
    BITNOT,
    EQ,
    ADDEQ,
    SUBEQ,
    CATEQ,
    MULEQ,
    DIVEQ,
    MODEQ,
    LSHIFTEQ,
    RSHIFTEQ,
    BITOREQ,
    BITANDEQ,
    BITXOREQ,
    RANGETO,
    RANGELEN,
}

export class SourcePosition {
    constructor(public line: number, public column: number){}
}

export class SourceLocation {
    constructor(public begin: SourcePosition, public end: SourcePosition) {}
}

export class Token {
    constructor(public type: TokenType, public location: SourceLocation, public value: any = null) { }
}


export class Lexer {
    private input: string
    private line: number
    private column: number
    private offset: number

    private beginPosition: SourcePosition
    private beginOffset: number

    constructor(input: string) {
        this.input = input
        this.line = 1
        this.column = 1
        this.offset = 0

        this.mark()
    }

    /**
     * Mark current position
     */
    private mark(){
        this.beginPosition = new SourcePosition(this.line, this.column)
        this.beginOffset = this.offset
    }

    /**
     * Generate new token 
     */
    private token(type: TokenType): Token {
        const begin = this.beginPosition
        const end = new SourcePosition(this.line, this.column)
        const location = new SourceLocation(begin, end)
        const value = this.input.slice(this.beginOffset, this.offset)
        const token = new Token(type, location, value)
        return token
    }

    /**
     * Get next character from input buffer without advancing current position
     */
    private peek(): Char {
        return this.input[this.offset]        
    }
 
    /**
     * Get previous character from input buffer without changing current offset.
     * Make sure the function is not called when offset is zero
     */
    private prev(): Char {
        return this.input[this.offset-1]
    }

    /**
     * Advance current position and return the character
     */
    private advance(): Char {
        let ch = this.input[this.offset]
        this.offset += 1
        return ch
    }

    /**
     * Move current offset to previous position
     */
    private backward(){
        this.offset -= 1
    }

    /**
     * Advance
     */
    private advanceIf(callback): boolean {
        let ch = this.peek()
        if(callback(ch)){
            this.offset++
            this.column++
            return true
        }
        return false
    }

    private advanceWhile(callback) : boolean {
        let isAdvanced = false
        while(this.offset < this.input.length){
            isAdvanced = this.advanceIf(callback)
            if(isAdvanced === false){
                break
            }
        }
        return isAdvanced
    }

    /**
     * Get next token 
     */
    next(): Token {
        if(this.offset >= this.input.length){
            throw "eof"
        }

        /// skip whitespace
        this.skipWhitespace()

        this.mark()

        const ch = this.peek()
        if(this.isDigit(ch)){
            return this.consumeNumber()
        }else if(this.isAlpha(ch)){
            return this.consumeIdentifier()
        }else if(ch === '+' || ch === '-'){
            const _   = this.advance()
            const ch2 = this.peek()
            if(this.isDigit(ch2)){
                return this.consumeNumber()
            }else{
                throw "expected digit but got '" + ch2 + "' instead"
            }
        }else if(ch === '#'){
            return this.consumeComment()
        }else{
            throw "not implemented yet"
        }
    }

    /// skip whitespace
    private skipWhitespace(){
        while(this.offset < this.input.length){
            let nextCh = this.peek()
            switch(nextCh){
                case ' ':
                case '\t': 
                    this.offset++
                    this.column++
                    break
                case '\r':
                    this.offset++
                    this.column++
                    /// fallthrough
                case '\n':
                    this.offset++
                    this.line++
                    this.column = 1
                    break
                default:
                    return
            }
        }
    }

    /// consume comment 
    private consumeComment() : Token {
        const ch = this.advance()
        if(ch !== '#'){
            throw 'expected # for comment token but got ' + ch + 'instead'
        }

        /// consume until new line
        const isNotNewLine = x => x !== '\n'
        this.advanceWhile(isNotNewLine)

        /// value \r in last character is discarded
        if(this.prev() === '\r'){
            this.backward()
        }

        /// generate token without newline
        const token = this.token(TokenType.Comment)

        /// discard newline character
        this.skipWhitespace()

        return token
    }

    /// return Integer or Float
    private consumeNumber(): Token {
        // first char must be digit [0-9]
        this.advanceIf(this.isDigit)

        // next char must be [0-9_]
        const isDigit = this.isDigit.bind(this)
        const isDigitOrUnderscore = (x:Char) =>  isDigit(x) || x === '_'
        this.advanceWhile(isDigitOrUnderscore)

        return this.token(TokenType.Integer)
    }

    private consumeIdentifier(): Token {
        while(this.offset < this.input.length){
            const nextCh = this.advance()
            if(this.isAlpha(nextCh) == false){
                break
            }
        }

        return this.token(TokenType.Identifier)
    }

    private isDigit(ch: Char): boolean {
        return ch >= '0' && ch <= '9'
    }

    private isAlpha(ch: Char): boolean {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$'
    }
   
}

