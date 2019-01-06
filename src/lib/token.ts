import * as dt from './dt'

export const enum TokenType {
  Invalid,
  EndOfFile, /// this token is not produced by lexer
  WhiteSpace,

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
  DateTime
}

export function print(tt: TokenType): string {
  switch (tt) {
    case TokenType.Invalid:
      return 'INVALID_TOKEN'
    case TokenType.EndOfFile:
      return 'EOF'
    case TokenType.Comment:
      return 'COMMENT'
    case TokenType.Integer:
      return 'INTEGER'
    case TokenType.Float:
      return 'FLOAT'
    case TokenType.Identifier:
      return 'IDENTIFIER'

    case TokenType.LeftBracket:
      return '['
    case TokenType.RightBracket:
      return ']'
    case TokenType.LeftParen:
      return '('
    case TokenType.RightParen:
      return ')'
    case TokenType.LeftCurly:
      return '{'
    case TokenType.RightCurly:
      return '}'
    case TokenType.Equal:
      return '='
    case TokenType.Dot:
      return '.'
    case TokenType.Comma:
      return ','
    case TokenType.Colon:
      return ':'

    case TokenType.BasicString:
      return 'BASIC_STRING'
    case TokenType.LiteralString:
      return 'LITERAL_STRING'
    case TokenType.MultiLineBasicString:
      return 'MULTILINE_BASIC_STRING'
    case TokenType.MultiLineLiteralString:
      return 'MULTILINE_LITERAL_STRING'

    ///
    case TokenType.Date:
      return 'DATE'
    case TokenType.Time:
      return 'TIME'
    case TokenType.DateTime:
      return 'DATETIME'

    default:
      return 'UNKWOWN'
  }
}

export class SourcePosition {
  constructor(public line: number, public column: number) {}
}

export class SourceRange {
  constructor(public begin: SourcePosition, public end: SourcePosition) {}
}

export class Token {
  public type: TokenType

  /**
   * Contain raw text representation of token.
   */
  public image: string

  public location: SourceRange

  constructor(type: TokenType, location: SourceRange, image: string) {
    this.type = type
    this.image = image
    this.location = location
  }

  /// return representation
  value(): string | number | dt.Date | dt.Time | dt.DateTime {
    switch (this.type) {
      case TokenType.Integer:
      case TokenType.Float:
        return this.extractFloat(this.image)
      case TokenType.BasicString:
        return this.extractString(this.image)
      case TokenType.LiteralString:
        return this.extractLiteralString(this.image)
      case TokenType.MultiLineBasicString:
        return this.extractMultiLineString(this.image)
      case TokenType.MultiLineLiteralString:
        return this.extractMultiLineLiteralString(this.image)
      case TokenType.Identifier:
        return this.image
      case TokenType.Date:
        return this.extractDate(this.image)
      case TokenType.Time:
        return this.extractTime(this.image)
      case TokenType.DateTime:
        return this.extractDateTime(this.image)
      default:
        throw 'jsValue(): not yet implemented'
    }
  }

  private extractFloat(input: string): number {
    const value = input.replace(/_/g, '')
    return parseFloat(value)
  }

  /// get content between quote
  private extractLiteralString(input: string): string {
    const content = input.slice(1, input.length - 1)
    return content
  }

  private extractString(input: string): string {
    return JSON.parse(input)
  }

  private extractMultiLineString(input: string): string {
    /// replace windows new line style to unix
    /// replace """\n with single "
    /// replace """ with single "
    const content1 = input.replace(/\r\n/g, '\n')
    const content2 = content1.replace('"""\n', '"""')
    const content3 = content2.slice(2, content2.length - 2)
    const content4 = content3.replace(/\\\n[\n ]*/g, '')
    const content5 = content4.replace(/\n/g, '\\n')

    // console.log("content3:",content3)
    // console.log("content4:",content4)
    // console.log("content5:",content5)

    return this.extractString(content5)
  }

  private extractMultiLineLiteralString(input: string): string {
    /// replace windows new line style to unix
    /// replace '''\n with single '
    /// replace ''' with single '
    const content1 = input.replace(/\r\n/g, '\n')
    const content2 = content1.replace(`'''\n`, `'''`)
    const content3 = content2.slice(2, content2.length - 2)

    return this.extractLiteralString(content3)
  }

  private extractDateTime(input: string): dt.DateTime {
    const [date, time] = input.split('T')
    const jsDate = this.extractDate(date)
    const jsTime = this.extractTime(time)
    const jsDt = new dt.DateTime(jsDate, jsTime)

    return jsDt
  }

  private extractDate(input: string): dt.Date {
    const items = input.split('-').map(x => parseInt(x, 10))
    const [year, month, day] = items
    const date = new dt.Date(year, month, day)
    return date
  }

  /// NOTE: simplify this code!!!
  private extractTime(input: string): dt.Time {
    const items = input
      .substr(0, 8)
      .split(':')
      .map(x => parseInt(x, 10))
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

        if (partitionIndex === -1) {
          fractions = parseInt(input, 10)
        } else {
          const fractionInput = input.substr(0, partitionIndex)
          const tzInput = input.substr(partitionIndex)

          fractions = parseInt(fractionInput, 10)

          const pattern = /^([+-])(\d{2}):(\d{2})$/
          // console.log(tzInput)
          const exprs = pattern.exec(tzInput)
          // console.log("exprs:", exprs)
          // console.log('part')
          if (exprs === null) {
            throw 'extractTime(): unexpected null'
          }

          const sign = exprs[1] as dt.TimeOffsetSign
          const tzHour = parseInt(exprs[2], 10)
          const tzMin = parseInt(exprs[3], 10)
          tzOffset = new dt.TimeOffset(sign, tzHour, tzMin)
        }
      }
    } else if (input[0] === '+' || input[0] === '-') {
      /// only offset
      const sign = input[0] as dt.TimeOffsetSign
      const [tzHours, tzMinutes] = input
        .substr(1)
        .split(':')
        .map(x => parseInt(x, 10))
      tzOffset = new dt.TimeOffset(sign, tzHours, tzMinutes)
    } else if (input[0] === 'Z') {
      tzOffset = new dt.TimeOffset()
    }

    const time = new dt.Time(hours, minutes, seconds, fractions, tzOffset)
    return time
  }
}
