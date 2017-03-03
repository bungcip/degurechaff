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
        switch (this.type) {
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
    private extractString(input: string): string {
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

    /// NOTE: simplify this code!!!
    private extractTime(input: string): dt.Time {
        const items = input.substr(0, 8).split(':').map(x => parseInt(x, 10))
        const [hours, minutes, seconds] = items

        input = input.substr(8)

        let fractions: null | number = null
        let tzOffset: null | dt.TimeOffset = null

        if (input[0] === '.') {
            /// fractions
            input = input.substr(1)

            if (input.endsWith('Z')) {
                input = input.substr(0, input.length - 1)

                tzOffset = new dt.TimeOffset()
                fractions = parseInt(input, 10)
            } else {
                const plusIndex = input.indexOf('+')
                const minusIndex = input.indexOf('-')
                const partitionIndex = Math.max(plusIndex, minusIndex)

                if(partitionIndex === -1){
                    fractions = parseInt(input, 10)
                }else{
                    let fractionInput = input.substr(0, partitionIndex)
                    let tzInput = input.substr(partitionIndex)

                    fractions = parseInt(fractionInput, 10)

                    const pattern = /^([+-])(\d{2}):(\d{2})$/;
                    // console.log(tzInput)
                    const exprs = pattern.exec(tzInput)
                    // console.log("exprs:", exprs)
                    // console.log('part')
                    if(exprs === null){
                        throw "extractTime(): unexpected null"
                    }

                    const sign = exprs[1] as dt.TimeOffsetSign
                    const tzHour = parseInt(exprs[2], 10)
                    const tzMin  = parseInt(exprs[3], 10);
                    tzOffset = new dt.TimeOffset(sign, tzHour, tzMin)
                }
            }
        }else if(input[0] === '+' || input[0] === '-'){
            /// only offset
            const sign = input[0] as dt.TimeOffsetSign
            const [tzHours, tzMinutes] = input.substr(1).split(':').map( x => parseInt(x, 10))
            tzOffset = new dt.TimeOffset(sign, tzHours, tzMinutes)
        }else if(input[0] === 'Z'){
            tzOffset = new dt.TimeOffset()
        }

        const time = new dt.Time(hours, minutes, seconds, fractions, tzOffset)
        return time
    }


}
