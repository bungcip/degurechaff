import {Token, TokenType, SourcePosition, SourceRange} from './token'

type Char = string
type LexerCallback = (Char) => boolean

export class Lexer {
    private input: string
    private line: number
    private column: number
    private offset: number

    private markedPosition: SourcePosition
    private markedOffset: number
    private markedLine: number
    private marketColumn: number

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
    private mark() {
        this.markedPosition = new SourcePosition(this.line, this.column)
        this.markedOffset = this.offset
        this.markedLine = this.line
        this.marketColumn = this.column
    }

    /**
     * rewind offset to last marked position
     */
    private rewind(){
        this.offset = this.markedOffset
        this.line = this.markedLine
        this.column = this.marketColumn
    }

    /**
     * Generate new token 
     */
    private token(type: TokenType): Token {
        const begin = this.markedPosition
        const end = new SourcePosition(this.line, this.column)
        const location = new SourceRange(begin, end)
        const value = this.input.slice(this.markedOffset, this.offset)
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
        return this.input[this.offset - 1]
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
    private backward() {
        this.offset -= 1
    }

    /**
     * Advance
     */
    private advanceIf(callback: Char | LexerCallback): boolean {
        let ch = this.peek()
        let advanced: boolean

        if(typeof callback === 'string'){
            advanced = callback === ch
        }else{
            advanced = callback(ch)
        }

        if (advanced) {
            this.offset++
            this.column++
            return true
        }
        return false
    }

    /// return how many character advanced. 0 if not advanced
    private advanceWhile(callback): number {
        let beginOffset = this.offset
        let isAdvanced = false
        while (this.offset < this.input.length) {
            isAdvanced = this.advanceIf(callback)
            if (isAdvanced === false) {
                break
            }
        }

        let count = this.offset - beginOffset
        return count
    }

    private advanceUntil(callback): boolean {
        const until = x => callback(x) === false
        return this.advanceWhile(until) > 0
    }

    /// consume current character 
    private expect(expectedCh: Char) {
        let ch = this.advance()
        if (ch != expectedCh) {
            throw "Expect character '" + expectedCh + "' but got '" + ch + "' instead"
        }
    }

    /**
     * Get next token 
     */
    next(): Token {
        /// skip whitespace
        this.skipWhitespace()

        if (this.offset >= this.input.length) {
            this.mark()
            return this.token(TokenType.EndOfFile)
        }

        this.mark()

        const ch = this.peek()
        if (this.isDigit(ch) || ch === '+' || ch === '-') {
            return this.consumeNumberOrIdentifier()
        } else if (this.isAlpha(ch) || ch === '_') {
            return this.consumeIdentifier()
        } else if (ch === '#') {
            return this.consumeComment()
        } else if (ch === '"') {
            return this.consumeBasicString()
        } else if (ch === '\'') {
            return this.consumeLiteralString()
        } else {
            let token = this.consumeSimpleToken()
            return token
        }
    }

    /// skip whitespace
    private skipWhitespace() {
        while (this.offset < this.input.length) {
            let nextCh = this.peek()
            switch (nextCh) {
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
    private consumeComment(): Token {
        this.expect('#')

        /// consume until new line
        const isNotNewLine = x => x !== '\n'
        this.advanceWhile(isNotNewLine)

        /// value \r in last character is discarded
        if (this.prev() === '\r') {
            this.backward()
        }

        /// generate token without newline
        const token = this.token(TokenType.Comment)

        /// discard newline character
        this.skipWhitespace()

        return token
    }

    /// return Integer or Float or Identifier
    private consumeNumberOrIdentifier(): Token {
        /// 
        const isPositiveNegative = x => x === '+' || x === '-'
        const isDigit = this.isDigit.bind(this)
        const isDigitOrUnderscore = (x: Char) => isDigit(x) || x === '_'
        let type = TokenType.Integer

        /// parse decimal Integer
        this.advanceIf(isPositiveNegative)
        this.advanceIf(this.isDigit)
        this.advanceWhile(isDigitOrUnderscore)

        /// parse fractions
        const isFraction = this.advanceIf(x => x === '.')
        if(isFraction){
            type = TokenType.Float
            this.advanceWhile(isDigitOrUnderscore)
        }
        
        /// parse exponent
        const isExponent = this.advanceIf(x => x === 'e' || x === 'E' )
        let isExponentPositive = false
        if(isExponent){
            let nextCh = this.peek()
            if(nextCh === '+'){
                this.advance()
                isExponentPositive = true
            }else if(nextCh === '-'){
                this.advance()
            }

            this.advanceWhile(isDigitOrUnderscore)
        }

        /// number can be identifier if next char is a-z
        const isIdentifier = this.advanceIf(this.isAlpha)
        if(isIdentifier){
            type = TokenType.Identifier

            const isAlphaOrUnderscore = (x: Char) => this.isAlpha(x) || x === '_'
            this.advanceWhile(isAlphaOrUnderscore)

            /// identifier cannot contain '.'  or '+'
            /// so we must mark this token as invalid
            if(isFraction || isExponentPositive){
                throw "consumeNumberOrIdentifier(): identifier cannot contain '.' or '+'"
            }
        }

        /// maybe this is date?
        /// example of date: 1979-05-27T00:32:00.999999
        if(type === TokenType.Integer && isExponent === false){
            const nextCh = this.peek()

            switch(nextCh){
                case '-':
                    /// back to previous marker
                    this.rewind()
                    return this.consumeDateTime()
                case ':':
                    this.rewind()
                    return this.consumeTime()
            }
        }


        return this.token(type)
    }

    private advanceExact(callback, count, errorMessage){
        let n = this.advanceWhile(callback)
        if(n !== count){
            throw errorMessage
        }
    }

    private consumeDateTime(){
        let type = TokenType.Date

        this.advanceExact(this.isDigit, 4, "consumeDateTime(): yearDigit must be 4")
        this.expect('-')
        this.advanceExact(this.isDigit, 2, "consumeDateTime(): monthDigit must be 2")
        this.expect('-')
        this.advanceExact(this.isDigit, 2, "consumeDateTime(): dateDigit must be 2")

        /// optional parts, time
        let isTime = this.advanceIf('T')
        if(isTime){
            type = TokenType.DateTime
            this.consumeTime()
        }

        return this.token(type)
    }

    private consumeTime(){
        this.advanceExact(this.isDigit, 2, "consumeTime(): hours must be 2")
        this.expect(':')
        this.advanceExact(this.isDigit, 2, "consumeTime(): minute must be 2")
        this.expect(':')
        this.advanceExact(this.isDigit, 2, "consumeTime(): seconds must be 2")
        if(this.advanceIf('.')){
            const fracDigit = this.advanceWhile(this.isDigit)
            if(fracDigit == 0){
                throw "consumeTime(): fractions digit need minimum 1 digit"
            }
        }

        return this.token(TokenType.Time)
    }

    /// return token Identifier
    private consumeIdentifier(): Token {
        const isAlpha = this.isAlpha.bind(this)
        const isAlphaOrUnderscore = (x: Char) => isAlpha(x) || x === '_'
        const isAlphaOrUnderscoreOrDashOrDigit = (x: Char) => 
            isAlphaOrUnderscore(x) || this.isDigit(x) || x === '-'

        // first char must be alpha or _ [a-zA-Z_]
        this.advanceIf(isAlphaOrUnderscore)

        /// next char must [a-zA-Z_-0-9]
        this.advanceWhile(isAlphaOrUnderscoreOrDashOrDigit)

        return this.token(TokenType.Identifier)
    }

    /// consume basic string
    private consumeBasicString(): Token {
        this.expect('"')

        /// next character must be UTF8
        let endOfString = false
        while (endOfString === false && this.offset < this.input.length) {
            let ch = this.peek()
            switch (ch) {
                case '"':
                    this.advance()
                    endOfString = true
                    break
                case '\\':
                    this.consumeEscape()
                    break
                case '\n':
                    throw "newline is not allowed"
                default:
                    this.advance()
            }
        }

        return this.token(TokenType.BasicString)
    }

    private consumeEscape() {
        this.expect("\\")

        let code: Char[] = []
        let ch = this.advance()
        switch (ch) {
            case 'b':
            case 't':
            case 'n':
            case 'f':
            case 'r':
            case '"':
            case '\\':
                code.push(ch)
                return
            case 'u':
                /// get 4 char code
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                break
            case 'U':
                /// get 7 char code
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                code.push(this.advance())
                break
            default:
                throw 'not yet implemented'
        }
    }

    private consumeLiteralString(): Token {
        this.expect('\'')

        /// next character must be UTF8
        let endOfString = false
        while (endOfString === false && this.offset < this.input.length) {
            let ch = this.peek()
            switch (ch) {
                case '\'':
                    this.advance()
                    endOfString = true
                    break
                default:
                    this.advance()
            }
        }

        return this.token(TokenType.LiteralString)
    }

    private consumeSimpleToken(): Token {
        /// single character token
        let ch = this.advance()
        let tt = TokenType.Invalid
        switch (ch) {
            case '[': tt = TokenType.LeftBracket; break
            case ']': tt = TokenType.RightBracket; break
            case '(': tt = TokenType.LeftParen; break
            case ')': tt = TokenType.RightParen; break
            case '{': tt = TokenType.LeftCurly; break
            case '}': tt = TokenType.RightCurly; break
            case '=': tt = TokenType.Equal; break
            case '.': tt = TokenType.Dot; break
            case ',': tt = TokenType.Comma; break
            case ':': tt = TokenType.Colon; break
            default:
                console.log("input:", this.input)
                console.log("offset:", this.offset)
                throw "expected single char token but got " + ch + " instead"
        }
        return this.token(tt)

    }

    private isDigit(ch: Char): boolean {
        return ch >= '0' && ch <= '9'
    }

    private isAlpha(ch: Char): boolean {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
    }

}

