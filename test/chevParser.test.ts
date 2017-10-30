import * as cp from '../src/lib/chevParser'

function setupParser(input: string){
    const lexerResult = cp.TomlLexer.tokenize(input)
    const parser = new cp.TomlParser(lexerResult.tokens)
    parser.root()
    
    return parser
}

function setupParserAndCst(input: string){
    const lexerResult = cp.TomlLexer.tokenize(input)
    const parser = new cp.TomlParser(lexerResult.tokens)
    const cst = parser.root()
    
    return [parser, cst]
}


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
    expect(lexer.errors).toEqual( [])
})

test("lexer: must be identifier not true and false", () => {
    const input = `trueeeee falseeeee`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 2)
    expect(lexer.tokens[0].image).toEqual( 'trueeeee')
    expect(lexer.tokens[1].image).toEqual( 'falseeeee')
})

test("lexer: whitespace and new line", () => {
    const input = `
    a
    b


    c
    `
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 9)
})

test("lexer: integer and float", () => {
    const input = `1234567890 +1.22e+4 9_224_617.445_991_228_313`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 3)
    expect(lexer.tokens[0].image).toEqual( '1234567890')
    expect(lexer.tokens[1].image).toEqual( '+1.22e+4')
    expect(lexer.tokens[2].image).toEqual( '9_224_617.445_991_228_313')
})

test("lexer: date, time, and datetime", () => {
    const input = `1979-05-27 11:30:05 1979-05-27T11:30:05 1979-05-27T11:30:05.999999`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 4)
    expect(lexer.tokens[0].image).toEqual( '1979-05-27')
    expect(lexer.tokens[1].image).toEqual( '11:30:05')
    expect(lexer.tokens[2].image).toEqual( '1979-05-27T11:30:05')
    expect(lexer.tokens[3].image).toEqual( '1979-05-27T11:30:05.999999')
})

test("lexer: datetime", () => {
    const input = `1979-05-27T11:30:05Z 1979-05-27T00:32:00-07:00 1979-05-27T11:30:05.999999+11:00`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 3)
    expect(lexer.tokens[0].image).toEqual( '1979-05-27T11:30:05Z')
    expect(lexer.tokens[1].image).toEqual( '1979-05-27T00:32:00-07:00')
    expect(lexer.tokens[2].image).toEqual( '1979-05-27T11:30:05.999999+11:00')
})

test("lexer: multiline basic string", () => {
    const input = `"""""" """simple""" """\nhave new line\n"""`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 3)
    expect(lexer.tokens[0].image).toEqual( `""""""`)
    expect(lexer.tokens[1].image).toEqual( `"""simple"""`)
    expect(lexer.tokens[2].image).toEqual( `"""\nhave new line\n"""`)
})

test("lexer: multiline basic string with backslash", () => {
    const input = `"""I HAVE\\\n  BACKSLASH """`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 1)
    expect(lexer.tokens[0].image).toEqual( `"""I HAVE\\\n  BACKSLASH """`)
})


test("lexer: multiline literal string", () => {
    const input = `'''''' '''simple''' '''\nhave new line\n'''`
    const lexer = cp.TomlLexer.tokenize(input)
    expect(lexer.errors).toEqual( [])
    expect(lexer.tokens.length).toEqual( 3)
    expect(lexer.tokens[0].image).toEqual( `''''''`)
    expect(lexer.tokens[1].image).toEqual( `'''simple'''`)
    expect(lexer.tokens[2].image).toEqual( `'''\nhave new line\n'''`)
})


test("parser: empty toml", () => {
    const testEmpty = (value) => {
        const input = `${value}`
        const parser = setupParser(input)
        expect(parser.errors).toEqual( [])
    }

    testEmpty(``)
    testEmpty(`# with single comment`)
    testEmpty(`
    # first comment

    # second comment
    `)
})

test("parser: valid key", () => {
    const testKey = (value) => {
        const input = `${value} = 0`
        const parser = setupParser(input)

        expect(parser.errors).toEqual( [])

    }

    testKey(`true`)
    testKey(`false`)
    testKey(`key`)
    testKey(`bare-key`)
    testKey(`bare_key`)
    testKey(`123456789`)
    testKey(`"with quote. and some special character +-"`)
    testKey(`'or "single quote"'`)
    testKey(`"ʎǝʞ"`)
})

test("parser: atomic value", () => {
    const testAtomic = (value) => {
        const input = `key = ${value}`
        const parser = setupParser(input)

        expect(parser.errors).toEqual( [])
    }

    testAtomic(`1234567890`)
    testAtomic(`1.2`)
    testAtomic(`true`)
    testAtomic(`false`)
    testAtomic(`"hello world"`)
    testAtomic(`'literal string d{4}'`)
    testAtomic(`"""multiline\nbasic\nstring"""`)
    testAtomic(`"""multiline\nliteral\nstring"""`)
    testAtomic(`1979-05-27`)
    testAtomic(`11:30:05`)
    testAtomic(`1979-05-27T11:30:05.999999`)
})

test('parse value array', () => {
    const testArray = (value) => {
        const input = `key = ${value}`
        const parser = setupParser(input)

        expect(parser.errors).toEqual( [])
    }

    testArray("[]")
    testArray("[1]")
    testArray("[1,2,3]")
    testArray("[1,2,3,]")

    testArray("[[1],[2],[3],]")
})


test("parse value inline table", () => {
    const testTable = (value) => {
        const input = `key = ${value}`
        const parser = setupParser(input)

        expect(parser.errors).toEqual( [])
    }

    testTable("{}")
    testTable("{a = 20}")
    testTable("{a = 20, b = 30, c = 40}")
})



test("parser: root pairs", () => {
    const input = `
    ## comment

    key1  = 1
    key-2 = 2

`   
    const parser = setupParser(input)
    expect(parser.errors).toEqual( []) 
})

test("parser: table", () => {
    const testTable = (input) => {
        const parser = setupParser(input)
        expect(parser.errors).toEqual( [])
    }

    testTable(`[empty]`)
    testTable(`[table]
        key1 = 1

        key2 = 2
    `)
})

test("parser: valid table name", () => {
    const testTableName = (input) => {
        const parser = setupParser(`[ ${input} ]`)
        expect(parser.errors).toEqual( [])
    }

    testTableName(`identifier`)
    testTableName(`with-dash-and_underscore`)
    testTableName(`a.b.c`)
    testTableName(`g .  h  . i`)
    testTableName(`j . "ʞ" . 'l'`)
    testTableName(`1.2.3`)
})

/// NOTE: activate when error recory code began coding
// test("parser: invalid table name", () => {
//     const testInvalid = (input) => {
//         const parser = setupParser(`[ ${input} ]`)
//         console.log(parser.errors)
//         expect(parser.errors).toEqual( [])
//     }

//     testInvalid(``)
//     testInvalid(`a.`)
//     testInvalid(`a..b`)
//     testInvalid(`.b`)
//     testInvalid(`.`)
// })

test("parser: arrayOfTable", () => {
    const testTable = (input, aotLength) => {
        const [parser, cst] = setupParserAndCst(input)
        expect(parser.errors).toEqual( [])
        expect(cst.children.arrayOfTable.length).toEqual( aotLength)
    }

    testTable(`[[empty]]`, 1)
    testTable(`[[array-of-table]]
        key1 = 1

        key2 = 2
    `, 1)
})

test("parser: pair & table combo", () => {
    const testCombo = (input: string) => {
        const parser = setupParser(input)
        expect(parser.errors).toEqual( [])
    }

    testCombo(`
        foo = "bar"
        [table]
            foo = "bar"
    `)
})