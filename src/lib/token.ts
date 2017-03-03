import * as dt from './dt'

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
    Colon,

    /// string
    BasicString,
    LiteralString,
    MultiLineBasicString,
    MultiLineLiteralString,

    /// 
    Date,
    Time,
    DateTime,

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

    /// return javascript builtin type representation
    jsValue(): string | number | dt.Date | dt.Time | dt.DateTime {
        switch(this.type){
            case TokenType.Integer:
            case TokenType.Float:
                return this.extractFloat(this.data)
            case TokenType.BasicString:
            case TokenType.LiteralString:
                return this.extractString(this.data)
            case TokenType.Identifier:
                return this.data
            case TokenType.Date:
                return this.extractDate(this.data)
            case TokenType.Time:
                return this.extractTime(this.data)
            case TokenType.DateTime:
                return this.extractDateTime(this.data)
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

    private extractDateTime(input: string): dt.DateTime {
        const [date, time] = input.split("T")
        const jsDate = this.extractDate(date)
        const jsTime = this.extractTime(time)
        const jsDt = new dt.DateTime(jsDate, jsTime)

        return jsDt
    }

    private extractDate(input: string): dt.Date {
        let items = input.split('-').map(x => parseInt(x, 10))
        const [year, month, day] = items
        const date = new dt.Date(year, month, day)
        return date
    }

    private extractTime(input: string): dt.Time {
        let [time, fraction] = input.split('.')
        let items = time.split(':').map(x => parseInt(x, 10))
        const [hours, minutes, seconds] = items
        const fractions = fraction === undefined ? null : parseInt(fraction, 10)
        const date = new dt.Time(hours, minutes, seconds, fractions)
        return date
    }


}
