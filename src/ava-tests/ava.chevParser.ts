import test from 'ava';
import * as cp from '../lib/chevParser'
import * as chevrotain from 'chevrotain'

function setupParser(input: string){
    const lexerResult = cp.TomlLexer.tokenize(input)
    const parser = new cp.TomlParser(lexerResult.tokens)
    parser.toml()

    return parser
}

test("lexer: valid token", t => {
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
    t.deepEqual(lexer.errors, [])
})

test("lexer: must be identifier not true and false", t => {
    const input = `trueeeee falseeeee`
    const lexer = cp.TomlLexer.tokenize(input)
    t.deepEqual(lexer.errors, [])
    t.deepEqual(lexer.tokens.length, 2)
    t.deepEqual(chevrotain.getImage(lexer.tokens[0]), 'trueeeee')
    t.deepEqual(chevrotain.getImage(lexer.tokens[1]), 'falseeeee')
})

test("lexer: whitespace and new line", t => {
    const input = `
    a
    b


    c
    `
    const lexer = cp.TomlLexer.tokenize(input)
    t.deepEqual(lexer.errors, [])
    t.deepEqual(lexer.tokens.length, 9)
})

test("lexer: integer and float", t => {
    const input = `1234567890 +1.22e+4 9_224_617.445_991_228_313`
    const lexer = cp.TomlLexer.tokenize(input)
    t.deepEqual(lexer.errors, [])
    t.deepEqual(lexer.tokens.length, 3)
    t.deepEqual(chevrotain.getImage(lexer.tokens[0]), '1234567890')
    t.deepEqual(chevrotain.getImage(lexer.tokens[1]), '+1.22e+4')
    t.deepEqual(chevrotain.getImage(lexer.tokens[2]), '9_224_617.445_991_228_313')
})


test("parser: empty toml", t => {
    const testEmpty = (value) => {
        const input = `${value}`
        const parser = setupParser(input)
        t.deepEqual(parser.errors, [])
    }

    testEmpty(``)
    testEmpty(`# with single comment`)
    testEmpty(`
    # first comment

    # second comment
    `)
})

test("parser: valid key", t => {
    const testKey = (value) => {
        const input = `${value} = 0`
        const parser = setupParser(input)

        t.deepEqual(parser.errors, [])

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

test("parser: atomic value", t => {
    const testAtomic = (value) => {
        const input = `key = ${value}`
        const parser = setupParser(input)

        t.deepEqual(parser.errors, [])
    }

    testAtomic(`1234567890`)
    testAtomic(`true`)
    testAtomic(`false`)
    testAtomic(`"hello world"`)
    testAtomic(`'literal string d{4}'`)
})



test("parser: root pairs", t => {
    const input = `
    ## comment

    key1  = 1
    key-2 = 2

`   
    const parser = setupParser(input)
    t.deepEqual(parser.errors, []) 
})

test("parser: table", t => {
    const testTable = (input) => {
        const parser = setupParser(input)
        t.deepEqual(parser.errors, [])
    }

    testTable(`[empty]`)
    testTable(`[table]
        key1 = 1

        key2 = 2
    `)
})

test("parser: valid table name", t => {
    const testTableName = (input) => {
        const parser = setupParser(`[ ${input} ]`)
        t.deepEqual(parser.errors, [])
    }

    testTableName(`identifier`)
    testTableName(`with-dash-and_underscore`)
    testTableName(`a.b.c`)
    testTableName(`g .  h  . i`)
    testTableName(`j . "ʞ" . 'l'`)
    testTableName(`1.2.3`)
})

/// NOTE: activate when error recory code began coding
// test("parser: invalid table name", t => {
//     const testInvalid = (input) => {
//         const parser = setupParser(`[ ${input} ]`)
//         console.log(parser.errors)
//         t.deepEqual(parser.errors, [])
//     }

//     testInvalid(``)
//     testInvalid(`a.`)
//     testInvalid(`a..b`)
//     testInvalid(`.b`)
//     testInvalid(`.`)
// })

test("parser: arrayOfTable", t => {
    const testTable = (input) => {
        const parser = setupParser(input)
        t.deepEqual(parser.errors, [])
    }

    testTable(`[[empty]]`)
    testTable(`[[array-of-table]]
        key1 = 1

        key2 = 2
    `)
})