/**
 *  new token, lexer & parser implementation using chevrotain
 */
import { Lexer, Parser, EOF, IMultiModeLexerDefinition, createToken } from 'chevrotain'

/// helper function to create regex pattern from other regex
function pattern(array: (RegExp | string)[]): RegExp {
  return new RegExp(array.map(x => (typeof x === 'string' ? x : x.source)).join(''))
}

const signFragment = /(-|\+)?/
const integerFragment = /(0|[1-9](\d|_)*)/
const expFragment = /([eE][+-]?[\d_]+)?/

const Float = createToken({
  name: 'Float',
  pattern: pattern([signFragment, integerFragment, '(\\.', '(0|[1-9])(\\d|_)', '*)?', expFragment])
})

const Integer = createToken({
  name: 'Integer',
  pattern: pattern([signFragment, integerFragment]),
  longer_alt: Float
})

const escapeFragment = /\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})/
const BasicString = createToken({
  name: 'BasicString',
  pattern: /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}))*"/
})

function matchMultiLineBasicString(input: string, offset: number): RegExpExecArray | null {
  let text = input.slice(offset)
  /// first 3 char must be """
  if (text.startsWith('"""') === false) {
    return null
  }

  /// check content string, allow new line & escape code
  let i = 3
  const textLength = text.length
  while (i < textLength) {
    const ch = text.charAt(i)

    /// check escape fragment
    if (ch === '\\') {
      /// test new line
      const isNewLine = text.slice(i + 1).match(/[ \t]*(\r\n|\n)/)
      if (isNewLine !== null) {
        i += isNewLine[0].length
        continue
      }

      /// test escape fragment
      const result = text.slice(i).match(escapeFragment)
      if (result === null) {
        return null
      }

      i += result[0].length
    } else if (ch === '"') {
      if (text.slice(i).startsWith('"""') === true) {
        const matchedString = text.substring(0, i + 3)
        const result = [matchedString] as RegExpExecArray
        return result
      }
    }

    i++
  }

  return null
}

const MultiLineBasicString = createToken({
  name: 'MultiLineBasicString',
  line_breaks: true,
  pattern: matchMultiLineBasicString
})

const LiteralString = createToken({ name: 'LiteralString', pattern: /'(:?[^\'])*'/ })

const MultiLineLiteralString = createToken({
  name: 'MultiLineLiteralString',
  line_breaks: true,
  pattern: /'''[\s\S]*?'''/
})

const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z0-9_\-]+/ })
const True = createToken({ name: 'True', pattern: 'true', longer_alt: Identifier })
const False = createToken({ name: 'False', pattern: 'false', longer_alt: Identifier })
const LeftBracket = createToken({ name: 'LeftBracket', pattern: '[', push_mode: 'INSIDE_BRACKET' })
const RightBracket = createToken({ name: 'RightBracket', pattern: ']', pop_mode: true })

const LeftCurly = createToken({ name: 'LeftCurly', pattern: '{' })
const RightCurly = createToken({ name: 'RightCurly', pattern: '}' })
const LeftParen = createToken({ name: 'LeftParen', pattern: '(' })
const RightParen = createToken({ name: 'RightParen', pattern: ')' })

const Comma = createToken({ name: 'Comma', pattern: ',' })
const Colon = createToken({ name: 'Colon', pattern: ':' })
const Dot = createToken({ name: 'Dot', pattern: '.' })
const Equal = createToken({ name: 'Equal', pattern: '=' })

const dateFragment = /\d{4}-\d{2}-\d{2}/
const timeFragment = /\d{2}:\d{2}:\d{2}(\.\d+)?/
const tzFragment = /(Z|([+-]\d{2}:\d{2}))?/

const DateTime = createToken({
  name: 'DateTime',
  pattern: pattern([dateFragment, /T/, timeFragment, tzFragment])
})

const Date = createToken({
  name: 'Date',
  pattern: dateFragment,
  longer_alt: DateTime
})

const Time = createToken({
  name: 'Time',
  pattern: timeFragment
})

const Comment = createToken({
  name: 'Comment',
  pattern: /#.*/,
  group: Lexer.SKIPPED,
  line_breaks: true
})

const NewLine = createToken({
  name: 'NewLine',
  pattern: /(\r\n|\n)/,
  line_breaks: true
})

const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED
})

const WhiteSpaceAndNewLine = createToken({
  name: 'WhiteSpaceAndNewLine',
  pattern: /[ \t\r\n]+/,
  group: Lexer.SKIPPED,
  line_breaks: true
})

const allTokens: IMultiModeLexerDefinition = {
  defaultMode: 'DEFAULT',
  modes: {
    DEFAULT: [
      WhiteSpace,
      NewLine,

      MultiLineBasicString,
      BasicString,

      MultiLineLiteralString,
      LiteralString,

      Date,
      Time,

      Integer,
      True,
      False,
      Identifier,

      LeftBracket,
      RightBracket,

      LeftCurly,
      RightCurly,
      Comma,
      Colon,
      Dot,
      Equal,

      Comment,

      /// Longer Alternative Token
      Float,
      DateTime
    ],

    INSIDE_BRACKET: [
      WhiteSpaceAndNewLine,

      MultiLineBasicString,
      BasicString,

      MultiLineLiteralString,
      LiteralString,

      Date,
      Time,

      Integer,
      True,
      False,
      Identifier,

      LeftBracket,
      RightBracket,

      LeftCurly,
      RightCurly,
      Comma,
      Colon,
      Dot,
      Equal,

      Comment,

      /// Longer Alternative Token
      Float,
      DateTime
    ]
  }
}

export const TomlLexer = new Lexer(allTokens)

export class TomlParser extends Parser {
  public root = this.RULE('root', () => {
    let once = false
    this.MANY({
      GATE: () => {
        let that = this as any /// NOTE: casting to any to allow isAtEndOfInput() call below
        return that.isAtEndOfInput() === false
      },
      DEF: () => {
        this.OR([
          { ALT: () => this.SUBRULE(this.arrayOfTable) },
          { ALT: () => this.SUBRULE(this.table) },
          {
            GATE: () => once === false,
            ALT: () => {
              this.SUBRULE(this.pairs)
              once = true
            }
          }
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

  // private tables = this.RULE("tables", () => {
  //     this.MANY(() => {
  //         this.OR([
  //             { ALT: () => this.SUBRULE(this.table) },
  //             { ALT: () => this.SUBRULE(this.arrayOfTable) },
  //         ])
  //     })
  // })

  private table = this.RULE('table', () => {
    this.CONSUME(LeftBracket)
    this.SUBRULE(this.tableName)
    this.CONSUME(RightBracket)

    this.SUBRULE(this.tableBody)
  })

  private tableBody = this.RULE('tableBody', () => {
    this.OPTION(() => {
      this.CONSUME(NewLine)
      this.SUBRULE(this.pairs)
    })
  })

  private arrayOfTable = this.RULE('arrayOfTable', () => {
    this.CONSUME1(LeftBracket)
    this.CONSUME2(LeftBracket)

    this.SUBRULE(this.tableName)

    this.CONSUME1(RightBracket)
    this.CONSUME2(RightBracket)

    this.SUBRULE(this.tableBody)
  })

  private tableName = this.RULE('tableName', () => {
    this.AT_LEAST_ONE_SEP({
      SEP: Dot,
      DEF: () => {
        this.SUBRULE(this.tableNameSegment)
      }
    })
  })

  private tableNameSegment = this.RULE('tableNameSegment', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(Integer) },
      /// need to split result between dot
      { ALT: () => this.CONSUME(Float) },

      { ALT: () => this.CONSUME(BasicString) },
      { ALT: () => this.CONSUME(LiteralString) },
      { ALT: () => this.SUBRULE(this.boolValue) }
    ])
  })

  private pairs = this.RULE('pairs', () => {
    // this.MANY(() => this.SUBRULE(this.pair))
    this.MANY(() =>
      this.OR1([
        {
          ALT: () => {
            this.CONSUME1(NewLine)
          }
        },
        {
          ALT: () => {
            this.SUBRULE(this.pair)
            this.OR2([{ ALT: () => this.CONSUME2(NewLine) }, { ALT: () => this.CONSUME3(EOF) }])
          }
        }
      ])
    )
  })

  private pair = this.RULE('pair', () => {
    this.SUBRULE(this.key)
    this.CONSUME(Equal)
    this.SUBRULE(this.value)
  })

  private key = this.RULE('key', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.stringValue) },

      { ALT: () => this.CONSUME(Integer) },
      { ALT: () => this.CONSUME(Identifier) },

      { ALT: () => this.SUBRULE(this.boolValue) }
    ])
  })

  private value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.stringValue) },
      { ALT: () => this.SUBRULE(this.numberValue) },
      { ALT: () => this.SUBRULE(this.boolValue) },
      { ALT: () => this.SUBRULE(this.arrayValue) },
      { ALT: () => this.SUBRULE(this.inlineTableValue) },
      { ALT: () => this.SUBRULE(this.dateValue) }
    ])
  })

  private boolValue = this.RULE('boolValue', () => {
    this.OR([{ ALT: () => this.CONSUME(True) }, { ALT: () => this.CONSUME(False) }])
  })

  private stringValue = this.RULE('stringValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(BasicString) },
      { ALT: () => this.CONSUME(LiteralString) },
      { ALT: () => this.CONSUME(MultiLineBasicString) },
      { ALT: () => this.CONSUME(MultiLineLiteralString) }
    ])
  })

  private numberValue = this.RULE('numberValue', () => {
    this.OR([{ ALT: () => this.CONSUME(Integer) }, { ALT: () => this.CONSUME(Float) }])
  })

  private dateValue = this.RULE('dateValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Date) },
      { ALT: () => this.CONSUME(Time) },
      { ALT: () => this.CONSUME(DateTime) }
    ])
  })

  private arrayValue = this.RULE('arrayValue', () => {
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

  private inlineTableValue = this.RULE('inlineTableValue', () => {
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

  constructor() {
    super(allTokens)
    this.performSelfAnalysis()
  }
}

export const parser = new TomlParser()
