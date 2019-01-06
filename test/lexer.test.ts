import { Lexer } from '../src/lib/lexer'
import { TokenType } from '../src/lib/token'

function tokenize(input: string, skipWs: boolean = true) {
  const lexer = new Lexer(input)
  const tokens = lexer.tokenize(skipWs)
  return tokens
}

test('lexer: valid token', () => {
  const input = `
        true false
        0 1234567890 +22 -75 1_2_3_4_5
        0.0 1.7E3 3.14e3 1e2 -1.3e3
        "yeah" 'foo {bar}'
        identifier identifier-with-dash identifier_with_underscore
        []{}=.,
        ## this is comment
    `
  const tokens = tokenize(input)
  expect(tokens.length).toBeGreaterThanOrEqual(1)
})

test('lexer: must be identifier not true and false', () => {
  const input = `trueeeee falseeeee`
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(2)
  expect(tokens[0].image).toEqual('trueeeee')
  expect(tokens[1].image).toEqual('falseeeee')
})

test('lexer: whitespace and new line', () => {
  const input = `
    a
    b


    c
    `
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(3)

  /// with withspace
  const allTokens = tokenize(input, false)
  expect(allTokens.length).toEqual(7)
})

test('lexer: whitespace new line inside bracket ignored', () => {
  const input = `[


    ]`
  const tokens = tokenize(input)

  expect(tokens.length).toEqual(2)
})

test('lexer: integer and float', () => {
  const input = `1234567890 +1.22e+4 9_224_617.445_991_228_313 3e2 3e-2 3E+2`
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(6)
  expect(tokens[0].image).toEqual('1234567890')
  expect(tokens[1].image).toEqual('+1.22e+4')
  expect(tokens[2].image).toEqual('9_224_617.445_991_228_313')
  expect(tokens[3].image).toEqual('3e2')
  expect(tokens[4].image).toEqual('3e-2')
  expect(tokens[5].image).toEqual('3E+2')
})

test('lexer: date, time, and datetime', () => {
  const input = `1979-05-27 11:30:05 1979-05-27T11:30:05 1979-05-27T11:30:05.999999`
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(4)
  expect(tokens[0].image).toEqual('1979-05-27')
  expect(tokens[1].image).toEqual('11:30:05')
  expect(tokens[2].image).toEqual('1979-05-27T11:30:05')
  expect(tokens[3].image).toEqual('1979-05-27T11:30:05.999999')
})

test('lexer: datetime', () => {
  const input = `1979-05-27T11:30:05Z 1979-05-27T00:32:00-07:00 1979-05-27T11:30:05.999999+11:00`
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(3)
  expect(tokens[0].image).toEqual('1979-05-27T11:30:05Z')
  expect(tokens[1].image).toEqual('1979-05-27T00:32:00-07:00')
  expect(tokens[2].image).toEqual('1979-05-27T11:30:05.999999+11:00')
})

test('lexer: datetime in array with trailing comma', () => {
  const input = `[1987-07-05T17:45:00Z,1979-05-27T07:32:00Z,2006-06-01T11:00:00Z,]`
  const tokens = tokenize(input)
  expect(tokens[0].image).toEqual('[')
  expect(tokens[1].image).toEqual('1987-07-05T17:45:00Z')
  expect(tokens[2].image).toEqual(',')
  expect(tokens[3].image).toEqual('1979-05-27T07:32:00Z')
  expect(tokens[4].image).toEqual(',')
  expect(tokens[5].image).toEqual('2006-06-01T11:00:00Z')
  expect(tokens[6].image).toEqual(',')
  expect(tokens[7].image).toEqual(']')
})

test('lexer: utf8 in basic string', () => {
  const input = `"ʞ"`
  const tokens = tokenize(input)
  expect(tokens[0].image).toEqual(`"ʞ"`)
  expect(tokens[0].type).toEqual(TokenType.BasicString)
})

test('lexer: multiline basic string', () => {
  const input = `"""""" """simple""" """\nhave new line\n"""`
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(3)
  expect(tokens[0].image).toEqual(`""""""`)
  expect(tokens[1].image).toEqual(`"""simple"""`)
  expect(tokens[2].image).toEqual(`"""\nhave new line\n"""`)
})

test('lexer: multiline basic string with backslash', () => {
  const input = `"""I HAVE\\\n  BACKSLASH """`
  const tokens = tokenize(input)
  expect(tokens.length).toEqual(1)
  expect(tokens[0].image).toEqual(`"""I HAVE\\\n  BACKSLASH """`)
})

test('lexer: multiline literal string', () => {
  const input = `'''''' '''simple''' '''\nhave new line\n'''`
  const tokens = tokenize(input)

  expect(tokens.length).toEqual(3)
  expect(tokens[0].image).toEqual(`''''''`)
  expect(tokens[1].image).toEqual(`'''simple'''`)
  expect(tokens[2].image).toEqual(`'''\nhave new line\n'''`)
})

test('lexer: unicode escape', () => {
  const input = `"\U000003B4" "\u03B4"`
  const tokens = tokenize(input)

  expect(tokens.length).toEqual(2)
  expect(tokens[0].image).toEqual(`"\U000003B4"`)
  expect(tokens[1].image).toEqual(`"\u03B4"`)
})

test('lexer: offset & position', () => {
  const input = `a b c

d e f
  `
  const tokens = tokenize(input, false)

  expect(tokens.length).toEqual(12)

  expect(tokens[0].location.begin.line).toEqual(1)
  expect(tokens[0].location.begin.column).toEqual(1)
  expect(tokens[0].location.end.line).toEqual(1)
  expect(tokens[0].location.end.column).toEqual(2)

  expect(tokens[2].location.begin.line).toEqual(1)
  expect(tokens[2].location.begin.column).toEqual(3)
  expect(tokens[2].location.end.line).toEqual(1)
  expect(tokens[2].location.end.column).toEqual(4)

  expect(tokens[4].location.begin.line).toEqual(1)
  expect(tokens[4].location.begin.column).toEqual(5)
  expect(tokens[4].location.end.line).toEqual(1)
  expect(tokens[4].location.end.column).toEqual(6)

  expect(tokens[6].location.begin.line).toEqual(3)
  expect(tokens[6].location.begin.column).toEqual(1)
  expect(tokens[6].location.end.line).toEqual(3)
  expect(tokens[6].location.end.column).toEqual(2)
})
