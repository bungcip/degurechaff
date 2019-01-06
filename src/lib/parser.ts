// import * as ast from './ast'
import * as cst from './cst'
import { Token, TokenType, SourceRange, SourcePosition, print as printToken } from './token'

/// pratt parser
export class Parser {
  // private root!: cst.Root
  private tokens: Token[]
  private eofToken: Token

  public errors: Token[] = [] /// sementara...

  constructor(tokens: Token[]) {
    this.tokens = tokens

    /// create token
    let lastToken = this.tokens[this.tokens.length - 1]
    let location
    if (lastToken === undefined) {
      location = new SourceRange(new SourcePosition(1, 1), new SourcePosition(1, 1))
    } else {
      location = lastToken.location
    }

    this.eofToken = new Token(TokenType.EndOfFile, location, '')
  }

  parseRoot(): cst.Root {
    const pairs = []
    const arrayOfTables = []
    const tables = []

    while (this.eof() === false) {
      let firstToken = this.peek(1)
      let secondToken = this.peek(2)

      if (firstToken.type === TokenType.LeftBracket) {
        if (secondToken.type === TokenType.LeftBracket) {
          let aot = this.parseArrayOfTable()
          arrayOfTables.push(aot)
        } else {
          let table = this.parseTable()
          tables.push(table)
        }
      } else {
        let pair = this.parsePair()
        pairs.push(pair)
      }
    }

    const node = new cst.Root(pairs, tables, arrayOfTables)
    return node
  }

  private expect(tt: TokenType): Token {
    const token = this.advance()
    if (token.type !== tt) {
      console.trace('ok')
      throw new Error(`Expected ${printToken(tt)} but got ${printToken(token.type)} ${token.image}`)
    }

    return token
  }

  private advanceIf(tt: TokenType): Token | false {
    let nextToken = this.peek()
    if (nextToken.type === tt) {
      return this.advance()
    }
    return false
  }

  private skipComment() {
    let token = this.tokens[0]
    while (token !== undefined && token.type === TokenType.Comment) {
      this.tokens.shift()
      token = this.tokens[0]
    }
  }

  /**
   * Get next token without advancing current position
   */
  private peek(n: number = 1): Token {
    this.skipComment()

    if (this.tokens.length < n) {
      return this.eofToken
    }

    return this.tokens[n - 1]
  }

  private advance(): Token {
    this.skipComment()

    if (this.tokens.length < 1) {
      return this.eofToken
    }

    /// this.tokens is guaranted to have minimun one element
    return this.tokens.shift() as Token
  }

  public eof(): boolean {
    let token = this.peek()
    if (token.type === TokenType.EndOfFile) {
      return true
    }

    return false
  }

  private parsePair(): cst.Pair {
    let key = this.parseKey()
    this.expect(TokenType.Equal)
    let value = this.parseValue()

    let node = new cst.Pair(key, value)
    return node
  }

  private parsePairs(): cst.Pair[] {
    let nodes: cst.Pair[] = []

    while (this.eof() === false) {
      let nextToken = this.peek()
      if (nextToken.type === TokenType.LeftBracket) {
        break
      }

      let pair = this.parsePair()
      nodes.push(pair)
    }

    return nodes
  }

  private parseKey(): cst.Key {
    const token = this.advance()
    const allowedTokens = [
      TokenType.Identifier,
      TokenType.BasicString,
      TokenType.LiteralString,
      TokenType.Integer
    ]
    if (allowedTokens.includes(token.type) === false) {
      // console.log(this.root.pairs)
      // console.trace("HORE")
      throw new Error('parseKey(): unexpected token found, ' + token.image)
    }

    const node = new cst.Key(token)
    return node
  }

  /**
   * parse value fragment
   */
  private parseValue(): cst.AtomicValue | cst.ArrayValue | cst.InlineTableValue {
    const token = this.peek()
    switch (token.type) {
      case TokenType.LeftBracket:
        return this.parseArray()
      case TokenType.LeftCurly:
        return this.parseInlineTable()
      default:
        return this.parseAtomic()
    }
  }

  parseAtomic(): cst.AtomicValue {
    const token = this.advance()
    let kind = cst.AtomicValueKind.String
    switch (token.type) {
      case TokenType.Integer:
        kind = cst.AtomicValueKind.Integer
        break
      case TokenType.Float:
        kind = cst.AtomicValueKind.Float
        break
      case TokenType.BasicString:
      case TokenType.LiteralString:
      case TokenType.MultiLineBasicString:
      case TokenType.MultiLineLiteralString:
        kind = cst.AtomicValueKind.String
        break
      case TokenType.Date:
      case TokenType.Time:
      case TokenType.DateTime:
        kind = cst.AtomicValueKind.Date
        break
      case TokenType.Identifier:
        /// check for boolean value
        const text = token.image
        if (text === 'true' || text === 'false') {
          kind = cst.AtomicValueKind.Boolean
          break
        }
        throw new Error("parseAtomic(): unexpected token found '" + token.image + "'")
      default:
        throw new Error("parseAtomic(): unexpected token found '" + token.image + "'")
    }
    const node = new cst.AtomicValue(kind, token)
    return node
  }

  private parseArray(): cst.ArrayValue {
    this.expect(TokenType.LeftBracket)

    const items: cst.Value[] = []

    while (this.eof() === false) {
      let nextToken = this.peek()
      switch (nextToken.type) {
        case TokenType.RightBracket:
          this.advance()
          const node = new cst.ArrayValue(items)
          return node
        default:
          const value = this.parseValue()
          items.push(value)
          nextToken = this.peek()
          switch (nextToken.type) {
            case TokenType.Comma:
              this.advance()
              continue
            case TokenType.RightBracket:
              continue
            default:
              throw new Error(
                'parseArray(): expected , or ] but got ' + nextToken.image + ' instead'
              )
          }
      }
    }

    throw new Error('EOF reached before token ] found')
  }

  private parseTable(): cst.Table {
    this.expect(TokenType.LeftBracket)
    const name = this.parseName()
    this.expect(TokenType.RightBracket)
    const pairs = this.parsePairs()

    const node = new cst.Table(name, pairs)
    return node
  }

  private parseName(): cst.Name {
    const segments: Token[] = []

    do {
      let token = this.advance()
      switch (token.type) {
        case TokenType.Identifier:
        case TokenType.BasicString:
        case TokenType.LiteralString:
        case TokenType.Integer:
          segments.push(token)
          break
        case TokenType.Float:
          /// 1.2 is actually <INTEGER> <DOT> <INTEGER>
          segments.push(token)
          break
        default:
          throw new Error(
            `expected IDENTIFIER, BASIC_STRING, LITERAL_STRING, or INTEGER as Name not ${
              token.image
            }`
          )
      }
    } while (this.advanceIf(TokenType.Dot))

    const node = new cst.Name(segments)
    return node
  }

  private parseArrayOfTable(): cst.ArrayOfTable {
    this.expect(TokenType.LeftBracket)
    this.expect(TokenType.LeftBracket)

    const name = this.parseName()

    this.expect(TokenType.RightBracket)
    this.expect(TokenType.RightBracket)

    const pairs = this.parsePairs()
    const node = new cst.ArrayOfTable(name, pairs)

    return node
  }

  /// helper parser to parse between expression
  private surround<T>(
    begin: TokenType,
    end: TokenType,
    separator: TokenType,
    callback: () => T
  ): T[] {
    this.expect(begin)

    let result: T[] = []
    while (this.peek().type !== end && this.eof() === false) {
      let item = callback()
      result.push(item)

      let advanced = this.advanceIf(separator)
      if (advanced === false) {
        break
      }
    }

    this.expect(end)
    return result
  }

  private parseInlineTable(): cst.InlineTableValue {
    let parsePair: () => cst.Pair = this.parsePair.bind(this)
    let pairs = this.surround(TokenType.LeftCurly, TokenType.RightCurly, TokenType.Comma, parsePair)
    let node = new cst.InlineTableValue(pairs)
    return node
  }
}
