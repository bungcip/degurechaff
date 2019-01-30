// import * as ast from './ast'
import * as cst from './cst'
import { Token, TokenType, SourceRange, SourcePosition, print as printToken } from './token'
import { LexerState } from './lexerState'

/// pratt parser
export class Parser {
  private state: LexerState
  public errors: Token[] = [] /// sementara...

  constructor(tokens: Token[]) {
    this.state = new LexerState(tokens)
  }

  private node(type: cst.Type, children: cst.NodeChildren): cst.Node {
    const begin = this.state.unmark()
    const end = this.state.position
    const instance = new cst.Node(type, begin, end, children)
    return instance
  }

  private atomic(type: cst.Type, kind: cst.AtomicValueKind): cst.AtomicNode {
    const begin = this.state.unmark()
    const end = this.state.position
    const instance = new cst.AtomicNode(type, begin, end, kind)
    return instance
  }

  parseRoot(): cst.Node {
    this.state.mark()

    const pairs = []
    const arrayOfTables = []
    const tables = []

    while (this.state.eof() === false) {
      const firstToken = this.state.peek(0)
      const secondToken = this.state.peek(1)

      if (firstToken.type === TokenType.LeftBracket) {
        if (secondToken.type === TokenType.LeftBracket) {
          const aot = this.parseArrayOfTable()
          arrayOfTables.push(aot)
        } else {
          const table = this.parseTable()
          tables.push(table)
        }
      } else {
        const pair = this.parsePair()
        pairs.push(pair)
      }
    }

    const children = new Map<cst.Type, cst.Node[]>()
    children.set(cst.Type.Pair, pairs)
    children.set(cst.Type.Table, tables)
    children.set(cst.Type.ArrayOfTable, arrayOfTables)

    const node = this.node(cst.Type.Root, children)
    return node
  }

  private expect(tt: TokenType): Token {
    const token = this.state.advance()
    if (token.type !== tt) {
      console.trace('ok')
      throw new Error(`Expected ${printToken(tt)} but got ${printToken(token.type)} ${token.image}`)
    }

    return token
  }

  private advanceIf(tt: TokenType): Token | false {
    const nextToken = this.state.current()
    if (nextToken.type === tt) {
      return this.state.advance()
    }
    return false
  }

  private parsePair(): cst.Node {
    this.state.mark()

    const key = this.parseKey()
    this.expect(TokenType.Equal)
    const value = this.parseValue()

    const node = this.node(cst.Type.Pair, [key, value])
    return node
  }

  private parsePairs(): cst.Node[] {
    const nodes: cst.Node[] = []

    while (this.state.eof() === false) {
      const current = this.state.current()
      if (current.type === TokenType.LeftBracket) {
        break
      }

      const pair = this.parsePair()
      nodes.push(pair)
    }

    return nodes
  }

  private parseKey(): cst.Node {
    this.state.mark()

    const token = this.state.advance()
    const allowedTokens = [
      TokenType.Identifier,
      TokenType.BasicString,
      TokenType.LiteralString,
      TokenType.Integer
    ]
    if (allowedTokens.includes(token.type) === false) {
      throw new Error('parseKey(): unexpected token found, ' + token.image)
    }

    const node = this.node(cst.Type.Key, [token])
    return node
  }

  /**
   * parse value fragment
   */
  private parseValue(): cst.Node {
    this.state.mark()

    const token = this.state.current()
    switch (token.type) {
      case TokenType.LeftBracket:
        return this.parseArray()
      case TokenType.LeftCurly:
        return this.parseInlineTable()
      default:
        return this.parseAtomic()
    }
  }

  parseAtomic(): cst.AtomicNode {
    this.state.mark()

    const token = this.state.advance()
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
    const node = this.atomic(cst.Type.Atomic, kind)
    return node
  }

  private parseArray(): cst.Node {
    this.state.mark()

    this.expect(TokenType.LeftBracket)

    const items: cst.Node[] = []

    while (this.state.eof() === false) {
      let current = this.state.current()
      switch (current.type) {
        case TokenType.RightBracket:
          this.state.advance()
          const node = this.node(cst.Type.Array, items)
          return node
        default:
          const value = this.parseValue()
          items.push(value)
          current = this.state.current()
          switch (current.type) {
            case TokenType.Comma:
              this.state.advance()
              continue
            case TokenType.RightBracket:
              continue
            default:
              throw new Error('parseArray(): expected , or ] but got ' + current.image + ' instead')
          }
      }
    }

    throw new Error('EOF reached before token ] found')
  }

  private parseTable(): cst.Node {
    this.state.mark()

    this.expect(TokenType.LeftBracket)
    const name = this.parseName()
    this.expect(TokenType.RightBracket)
    const pairs = this.parsePairs()

    pairs.unshift(name)

    const node = this.node(cst.Type.Table, pairs)
    return node
  }

  private parseName(): cst.Node {
    this.state.mark()

    const segments: Token[] = []

    do {
      let token = this.state.advance()
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

    const node = this.node(cst.Type.Name, segments)
    return node
  }

  private parseArrayOfTable(): cst.Node {
    this.state.mark()

    this.expect(TokenType.LeftBracket)
    this.expect(TokenType.LeftBracket)

    const name = this.parseName()

    this.expect(TokenType.RightBracket)
    this.expect(TokenType.RightBracket)

    const pairs = this.parsePairs()

    pairs.unshift(name)

    const node = this.node(cst.Type.ArrayOfTable, pairs)
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
    while (this.state.current().type !== end && this.state.eof() === false) {
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

  private parseInlineTable(): cst.Node {
    this.state.mark()

    const parsePair: () => cst.Node = this.parsePair.bind(this)
    const pairs = this.surround(
      TokenType.LeftCurly,
      TokenType.RightCurly,
      TokenType.Comma,
      parsePair
    )

    const node = this.node(cst.Type.InlineTable, pairs)
    return node
  }
}
