/// Test to check degurechaff parser 
/// with toml-test data

import { parse } from '../src/degurechaff'
import * as ast from '../src/lib/chevAst'
import * as utils from '../src/lib/utils'

import { exceptions } from 'chevrotain'
import fs from 'fs'


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

import path from 'path'


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

    // testInvalid('test/data/invalid', 'duplicate-key-table')

})