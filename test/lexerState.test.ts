import { Lexer } from '../src/lib/lexer'
import { TokenType } from '../src/lib/token'
import { LexerState } from '../src/lib/lexerState'

function tokenize(input: string, skipWs: boolean = true) {
  const lexer = new Lexer(input)
  const tokens = lexer.tokenize(skipWs)
  const state = new LexerState(tokens)

  return state
}

test('lexerState: eof', () => {
  const input = ``
  const state = tokenize(input)

  expect(state.eof()).toBe(true)
  expect(state.peek(1).type).toBe(TokenType.EndOfFile)
  expect(state.peek(2).type).toBe(TokenType.EndOfFile)
  expect(state.peek(3).type).toBe(TokenType.EndOfFile)
  expect(state.advance().type).toBe(TokenType.EndOfFile)
})

test('lexerState: simple navigation', () => {
  const input = `1 a [`
  const state = tokenize(input)

  /// first token
  expect(state.current().type).toBe(TokenType.Integer)
  expect(state.position).toBe(0)
  expect(state.peek(1).type).toBe(TokenType.Identifier)
  expect(state.position).toBe(0)

  /// second token
  expect(state.advance().type).toBe(TokenType.Integer)
  expect(state.position).toBe(1)
  expect(state.current().type).toBe(TokenType.Identifier)
  expect(state.position).toBe(1)
  expect(state.peek(1).type).toBe(TokenType.LeftBracket)
  expect(state.position).toBe(1)

  /// third token
  state.advance()
  expect(state.current().type).toBe(TokenType.LeftBracket)

  /// EOF
  state.advance()
  expect(state.current().type).toBe(TokenType.EndOfFile)
})
