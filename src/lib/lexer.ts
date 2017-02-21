type Char = string

export enum TokenType {
    Invalid,
    EndOfFile,

    Comment,

    Integer,
    Float,

    Identifier,

    /// single character token
    LeftBracket,
    RightBracket,
    LeftParen,
    RightParen,
    LeftCurly,
    RightCurly,

    Equal,
    Dot,
    Comma,

    /// string
    BasicString,
    LiteralString,

}

export class SourcePosition {
    constructor(public line: number, public column: number) { }
}

export class SourceRange {
    constructor(public begin: SourcePosition, public end: SourcePosition) { }
}

export class Token {
    constructor(public type: TokenType, public location: SourceRange, public value: any = null) { }
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
    private mark() {
        this.beginPosition = new SourcePosition(this.line, this.column)
        this.beginOffset = this.offset
    }

    /**
     * Generate new token 
     */
    private token(type: TokenType): Token {
        const begin = this.beginPosition
        const end = new SourcePosition(this.line, this.column)
        const location = new SourceRange(begin, end)
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
    private advanceIf(callback): boolean {
        let ch = this.peek()
        if (callback(ch)) {
            this.offset++
            this.column++
            return true
        }
        return false
    }

    private advanceWhile(callback): boolean {
        let isAdvanced = false
        while (this.offset < this.input.length) {
            isAdvanced = this.advanceIf(callback)
            if (isAdvanced === false) {
                break
            }
        }
        return isAdvanced
    }

    private advanceUntil(callback): boolean {
        const until = x => callback(x) === false
        return this.advanceWhile(until)
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
        if (this.isDigit(ch)) {
            return this.consumeNumber()
        } else if (this.isAlpha(ch) || ch === '_') {
            return this.consumeIdentifier()
        } else if (ch === '+' || ch === '-') {
            const _ = this.advance()
            const ch2 = this.peek()
            if (this.isDigit(ch2)) {
                return this.consumeNumber()
            } else {
                throw "expected digit but got '" + ch2 + "' instead"
            }
        } else if (ch === '#') {
            return this.consumeComment()
        } else if (ch === '"') {
            return this.consumeBasicString()
        } else if (ch === '\'') {
            return this.consumeLiteralString()
        } else {
            return this.consumeSimpleToken()
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

    /// return Integer or Float
    private consumeNumber(): Token {
        const isDigit = this.isDigit.bind(this)
        const isDigitOrUnderscore = (x: Char) => isDigit(x) || x === '_'

        // first char must be digit [0-9]
        this.advanceIf(this.isDigit)

        // next char must be [0-9_]
        this.advanceWhile(isDigitOrUnderscore)

        return this.token(TokenType.Integer)
    }

    /// return token Identifier
    private consumeIdentifier(): Token {
        const isAlpha = this.isAlpha.bind(this)
        const isAlphaOrUnderscore = (x: Char) => isAlpha(x) || x === '_'
        const isAlphaOrUnderscoreOrDash = (x: Char) => isAlphaOrUnderscore(x) || x === '-'

        // first char must be alpha or _ [a-zA-Z_]
        this.advanceIf(isAlphaOrUnderscore)

        /// next char must [a-zA-Z_-]
        this.advanceWhile(isAlphaOrUnderscoreOrDash)

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

