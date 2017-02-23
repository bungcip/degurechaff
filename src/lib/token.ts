export const enum TokenType {
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
    public type: TokenType

    /**
     * Contain raw text representation of token.
     */
    public data: string

    public location: SourceRange

    constructor(type: TokenType, location: SourceRange, data: string) { 
        this.type = type
        this.data = data
        this.location = location
    }

    jsValue(): string | number {
        switch(this.type){
            case TokenType.Integer:
            case TokenType.Float:
                return this.extractFloat(this.data)
            case TokenType.BasicString:
            case TokenType.LiteralString:
                return this.extractString(this.data)
            case TokenType.Identifier:
                return this.data
            default: 
                throw "jsValue(): not yet implemented"
        }
    }

    private extractFloat(input: string): number {
        let value = input.replace(/_/g, '')
        return parseFloat(value)
    }

    /// get content between quote
    private extractString(input: string): string{
        return input.slice(1, input.length - 1)
    }


}
