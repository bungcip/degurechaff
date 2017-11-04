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
    testArray(`[
        1987-07-05T17:45:00Z,
        1979-05-27T07:32:00Z,
        2006-06-01T11:00:00Z,
    ]`)
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
    testTable(`[[albums]]
    name = "Born to Run"
    
      [[albums.songs]]
      name = "Jungleland"
    
      [[albums.songs]]
      name = "Meeting Across the River"
    
    [[albums]]
    name = "Born in the USA"
      
      [[albums.songs]]
      name = "Glory Days"
    
      [[albums.songs]]
      name = "Dancing in the Dark"
    `, 6)
})

test("parser: arrayOfTable name", () => {
    const testTableName = (input) => {
        const parser = setupParser(`[[ ${input} ]]`)
        expect(parser.errors).toEqual( [])
    }

    testTableName(`identifier`)
    testTableName(`with-dash-and_underscore`)
    testTableName(`a.b.c`)
    testTableName(`g .  h  . i`)
    testTableName(`j . "ʞ" . 'l'`)
    testTableName(`1.2.3`)
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