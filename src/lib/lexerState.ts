import { TokenIndex } from './cst'
import { SourceRange, SourcePosition, Token, TokenType } from './token'

/**
 * Class to maintain lexer state
 * information when parsing tokens
 */
export class LexerState {
  private readonly tokens: Token[]
  private readonly eofToken: Token

  private markedIndices: TokenIndex[] /// marked token index

  public position: TokenIndex

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.position = 0
    this.markedIndices = []

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

  /**
   * Mark current position
   */
  mark() {
    this.markedIndices.push(this.position)
    return this.position
  }

  /**
   * Remove last marked position
   */
  unmark(): TokenIndex {
    return this.markedIndices.pop() || 0
  }

  /**
   * Get next token without advancing current position
   * n = 0 means get current position
   */
  peek(n: number = 1): Token {
    this.skipComment()
    const newIndex = this.position + n

    if (this.position >= this.tokens.length) {
      return this.eofToken
    }

    return this.tokens[newIndex]
  }

  /**
   * Get current token
   */
  current(): Token {
    return this.peek(0)
  }

  /**
   * return current token and advance position
   */
  advance(): Token {
    this.skipComment()

    if (this.position >= this.tokens.length) {
      return this.eofToken
    }

    const token = this.tokens[this.position]
    this.position++
    return token
  }

  eof(): boolean {
    const token = this.peek()
    if (token.type === TokenType.EndOfFile) {
      return true
    }

    return false
  }

  skipComment() {
    const nextIndex = this.position
    while (nextIndex < this.tokens.length) {
      const token = this.tokens[nextIndex]
      if (token.type === TokenType.Comment || token.type === TokenType.WhiteSpace) {
        this.position++
      } else {
        return
      }
    }
  }
}
