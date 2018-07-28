/// Test to check degurechaff parser
/// with toml-test data

import { parse } from '../src/degurechaff'
import * as ast from '../src/lib/chevAst'
import * as utils from '../src/lib/utils'

import * as fs from 'fs'
import * as path from 'path'

/// convert AST root node to JSON compatible object structure
/// in folder data
function toJsonSpec(root: ast.Root) {
    const result = {}

    /// convert pair first
    dumpPairs(result, root.pairs)

    /// tables
    for (const table of root.tables) {
        const currentObject = utils.lookupObject(result, table.name.segments)
        // console.log("segments::", table.name)
        // console.log("pairs::", table.pairs)
        dumpPairs(currentObject, table.pairs)
    }

    /// array of table
    for (const aot of root.arrayOfTables) {
        const currentArray = utils.lookupArray(result, aot.name.segments)
        // console.log("dump pairs::", aot.pairs)
        const newObject = {}
        dumpPairs(newObject, aot.pairs)

        // console.log("currentArray:", currentArray, "segments:", aot.name.segments)
        currentArray.push(newObject)
    }

    return result
}

function dumpPairs(node: Object, pairs: ast.Pair[]) {
    for (const pair of pairs) {
        const key = pair.key
        const value = pair.value
        node[key] = toValueSpec(value)
    }
}

function toValueSpec(data: ast.Value) {
    if (data instanceof ast.InlineTableValue) {
        const result = {}
        dumpPairs(result, data.pairs)
        return result
    }

    /// other data have same format {'type': ..., 'value': ....}
    let type
    let value
    if (data instanceof ast.ArrayValue) {
        type = 'array'
        value = []
        for (const item of data.items) {
            value.push(toValueSpec(item))
        }
    } else if (data instanceof ast.AtomicValue) {
        if (data.kind === ast.AtomicValueKind.String) {
            type = 'string'
            value = data.content
        } else if (data.kind === ast.AtomicValueKind.Integer) {
            type = 'integer'
            value = data.toString()
        } else if (data.kind === ast.AtomicValueKind.Float) {
            type = 'float'
            value = data.toString()
        } else if (data.kind === ast.AtomicValueKind.Boolean) {
            type = 'bool'
            value = data.toString()
        } else if (data.kind === ast.AtomicValueKind.Date) {
            type = 'datetime'
            value = data.toString()
        } else {
            throw new Error("sementara error: " + data.kind)
        }
    } else {
        throw new Error("imposible to reach")
    }

    return { type, value }
}



function testSpec(folder, filename) {
    const tomlData = fs.readFileSync(`${folder}/${filename}.toml`, 'utf8')
    const jsonData = fs.readFileSync(`${folder}/${filename}.json`, 'utf8')

    // console.log(tomlData)
    const root = parse(tomlData)

    /// convert to test json data
    const expected = JSON.parse(jsonData)

    /// check AST
    const result = toJsonSpec(root)

    expect(result).toEqual(expected)
}

function testInvalid(folder, filename){
    const tomlData = fs.readFileSync(`${folder}/${filename}.toml`, 'utf8')

    expect(() => {
        const root = parse(tomlData)
        const result = toJsonSpec(root)
    }).toThrow();
}



describe('test valid toml file', () => {
    const dirname = 'test/data/valid'
    const allFiles = fs.readdirSync(dirname)
    const tomlFiles = allFiles
        .filter(x => path.extname(x) === '.toml')

        /// FIXME: js native don't support big integer
        .filter(x => x !== 'long-integer.toml')
        /// FIXME: disable for now. revisit later when error handling done
        .filter(x => x !== 'table-array-table-array.toml')

        .map(x => path.basename(x).slice(0, -5))

    tomlFiles.forEach(filename => {
        test(`${filename}`, () => testSpec(dirname, filename))
    })
})


test('test invalid toml file', () => {
    testInvalid('test/data/invalid', 'array-mixed-types-arrays-and-ints')
    testInvalid('test/data/invalid', 'array-mixed-types-ints-and-floats')
    testInvalid('test/data/invalid', 'array-mixed-types-strings-and-ints')

    testInvalid('test/data/invalid', 'datetime-malformed-no-leads')
    testInvalid('test/data/invalid', 'datetime-malformed-no-secs')
    testInvalid('test/data/invalid', 'datetime-malformed-no-t')
    testInvalid('test/data/invalid', 'datetime-malformed-with-milli')

    testInvalid('test/data/invalid', 'duplicate-key-table')
    testInvalid('test/data/invalid', 'duplicate-keys')
    testInvalid('test/data/invalid', 'duplicate-tables')

    testInvalid('test/data/invalid', 'empty-implicit-table')
    testInvalid('test/data/invalid', 'empty-table')

    testInvalid('test/data/invalid', 'float-leading-zero-neg')
    testInvalid('test/data/invalid', 'float-leading-zero-pos')
    testInvalid('test/data/invalid', 'float-leading-zero')
    testInvalid('test/data/invalid', 'float-no-leading-zero')
    testInvalid('test/data/invalid', 'float-no-trailing-digits')
    testInvalid('test/data/invalid', 'float-underscore-after-point')


    testInvalid('test/data/invalid', 'integer-leading-zero-neg')
    testInvalid('test/data/invalid', 'integer-leading-zero-pos')
    testInvalid('test/data/invalid', 'integer-leading-zero')

    testInvalid('test/data/invalid', 'integer-underscore-before')

    testInvalid('test/data/invalid', 'key-empty')
    testInvalid('test/data/invalid', 'key-hash')
    testInvalid('test/data/invalid', 'key-newline')
    testInvalid('test/data/invalid', 'key-no-eol')
    testInvalid('test/data/invalid', 'key-open-bracket')
    testInvalid('test/data/invalid', 'key-space')
    testInvalid('test/data/invalid', 'key-start-bracket')
    testInvalid('test/data/invalid', 'key-two-equals')

    testInvalid('test/data/invalid', 'string-bad-byte-escape')
    testInvalid('test/data/invalid', 'string-bad-escape')
    testInvalid('test/data/invalid', 'string-bad-uni-esc')
    testInvalid('test/data/invalid', 'string-byte-escapes')
    testInvalid('test/data/invalid', 'string-no-close')

    testInvalid('test/data/invalid', 'table-array-implicit')
    testInvalid('test/data/invalid', 'table-array-malformed-bracket')
    testInvalid('test/data/invalid', 'table-array-malformed-empty')
    testInvalid('test/data/invalid', 'table-empty')

    testInvalid('test/data/invalid', 'table-nested-brackets-close')
    testInvalid('test/data/invalid', 'table-nested-brackets-open')
    testInvalid('test/data/invalid', 'table-whitespace')
    testInvalid('test/data/invalid', 'table-with-pound')

    testInvalid('test/data/invalid', 'text-after-array-entries')
    testInvalid('test/data/invalid', 'text-after-integer')
    testInvalid('test/data/invalid', 'text-after-string')
    testInvalid('test/data/invalid', 'text-after-table')
    testInvalid('test/data/invalid', 'text-before-array-separator')
    testInvalid('test/data/invalid', 'text-in-array')

    // / NOTE: toml node allow it
    // testInvalid('test/data/invalid', 'float-underscore-after')

    /// TODO: fix it
    // testInvalid('test/data/invalid', 'integer-underscore-after')
    // testInvalid('test/data/invalid', 'integer-underscore-double')
    // testInvalid('test/data/invalid', 'key-after-array')
    // testInvalid('test/data/invalid', 'key-after-table')
    // testInvalid('test/data/invalid', 'llbrace')
    // testInvalid('test/data/invalid', 'rrbrace')


})
