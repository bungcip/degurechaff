import * as cp from '../src/lib/chevParser'

test("lexer: valid token", () => {
    const input = `
        true false
        0 1234567890 +22 -75 1_2_3_4_5
        0.0 1.7E3 3.14e3 1e2 -1.3e3
        "yeah" 'foo {bar}'
        identifier identifier-with-dash identifier_with_underscore
        []{}=.,
        ## this is comment
    `
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
})

test("lexer: must be identifier not true and false", () => {
    const input = `trueeeee falseeeee`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(2)
    expect(lexer.tokens[0].image).toEqual('trueeeee')
    expect(lexer.tokens[1].image).toEqual('falseeeee')
})

test("lexer: whitespace and new line", () => {
    const input = `
    a
    b


    c
    `
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(9)
})

test("lexer: whitespace new line inside bracket ignored", () => {
    const input = `[


    ]`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(2)
})


test("lexer: integer and float", () => {
    const input = `1234567890 +1.22e+4 9_224_617.445_991_228_313`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(3)
    expect(lexer.tokens[0].image).toEqual('1234567890')
    expect(lexer.tokens[1].image).toEqual('+1.22e+4')
    expect(lexer.tokens[2].image).toEqual('9_224_617.445_991_228_313')
})

test("lexer: date, time, and datetime", () => {
    const input = `1979-05-27 11:30:05 1979-05-27T11:30:05 1979-05-27T11:30:05.999999`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(4)
    expect(lexer.tokens[0].image).toEqual('1979-05-27')
    expect(lexer.tokens[1].image).toEqual('11:30:05')
    expect(lexer.tokens[2].image).toEqual('1979-05-27T11:30:05')
    expect(lexer.tokens[3].image).toEqual('1979-05-27T11:30:05.999999')
})

test("lexer: datetime", () => {
    const input = `1979-05-27T11:30:05Z 1979-05-27T00:32:00-07:00 1979-05-27T11:30:05.999999+11:00`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(3)
    expect(lexer.tokens[0].image).toEqual('1979-05-27T11:30:05Z')
    expect(lexer.tokens[1].image).toEqual('1979-05-27T00:32:00-07:00')
    expect(lexer.tokens[2].image).toEqual('1979-05-27T11:30:05.999999+11:00')
})

test("lexer: datetime in array with trailing comma", () => {
    const input = `[1987-07-05T17:45:00Z,1979-05-27T07:32:00Z,2006-06-01T11:00:00Z,]`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens[0].image).toEqual('[')
    expect(lexer.tokens[1].image).toEqual('1987-07-05T17:45:00Z')
    expect(lexer.tokens[2].image).toEqual(',')
    expect(lexer.tokens[3].image).toEqual('1979-05-27T07:32:00Z')
    expect(lexer.tokens[4].image).toEqual(',')
    expect(lexer.tokens[5].image).toEqual('2006-06-01T11:00:00Z')
    expect(lexer.tokens[6].image).toEqual(',')
    expect(lexer.tokens[7].image).toEqual(']')
})

test("lexer: multiline basic string", () => {
    const input = `"""""" """simple""" """\nhave new line\n"""`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(3)
    expect(lexer.tokens[0].image).toEqual(`""""""`)
    expect(lexer.tokens[1].image).toEqual(`"""simple"""`)
    expect(lexer.tokens[2].image).toEqual(`"""\nhave new line\n"""`)
})

test("lexer: multiline basic string with backslash", () => {
    const input = `"""I HAVE\\\n  BACKSLASH """`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(1)
    expect(lexer.tokens[0].image).toEqual(`"""I HAVE\\\n  BACKSLASH """`)
})


test("lexer: multiline literal string", () => {
    const input = `'''''' '''simple''' '''\nhave new line\n'''`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual([])
    expect(lexer.tokens.length).toEqual(3)
    expect(lexer.tokens[0].image).toEqual(`''''''`)
    expect(lexer.tokens[1].image).toEqual(`'''simple'''`)
    expect(lexer.tokens[2].image).toEqual(`'''\nhave new line\n'''`)
})

