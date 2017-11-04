/// Test to check degurechaff parser 
/// with toml-test data

import {parse} from '../src/degurechaff'
import * as ast from '../src/lib/chevAst'
import * as utils from '../src/lib/utils'

import {exceptions} from 'chevrotain'
import fs from 'fs'


/// convert AST root node to JSON compatible object structure
/// in folder data
function toJsonSpec(root: ast.Root){
    const result = {}

    /// convert pair first
    dumpPairs(result, root.pairs)

    /// then tables
    for (const table of root.tables) {
        const currentObject = utils.lookupObject(result, table.name.segments)
        // console.log("segments::", table.name)
        // console.log("pairs::", table.pairs)
        dumpPairs(currentObject, table.pairs)
    }

    /// last array of table
    for (const aot of root.arrayOfTables) {
        const currentArray = utils.lookupArray(result, aot.name.segments)
        // console.log("dump pairs::", aot.pairs)
        const newObject = {}
        dumpPairs(newObject, aot.pairs)

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

function toValueSpec(data: ast.Value){
    let type
    let value

    if(data instanceof ast.ArrayValue){
        type = 'array'
        value = []
        for(const item of data.items){
            value.push( toValueSpec(item) )
        }
    }else if(data instanceof ast.AtomicValue){
        if(data.kind === ast.AtomicValueKind.String){
            type = 'string'
            value = data.content
        }else if(data.kind === ast.AtomicValueKind.Integer){
            type = 'integer'
            value = data.toString()
        }else if(data.kind === ast.AtomicValueKind.Float){
            type = 'float'
            value = data.toString()
        }else if(data.kind === ast.AtomicValueKind.Boolean){
            type = 'bool'
            value = data.toString()
        }else if(data.kind === ast.AtomicValueKind.Date){
            type = 'datetime'
            value = data.toString()
        }else{
            throw new Error("sementara error: " + typeof data)
        }
    }else{
        throw new Error("sementara error: " + typeof data)
    }

    return {type, value}
}



function testSpec(folder, filename){
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

import path from 'path'


describe('test valid toml file', () => {
    const dirname = 'test/data/valid'
    const allFiles = fs.readdirSync(dirname)
    const tomlFiles = allFiles
        .filter( x => path.extname(x) === '.toml')
        
        /// FIXME: js native don't support big integer
        .filter( x => x !== 'long-integer.toml')
        
        .map(x => path.basename(x).slice(0, -5))

    tomlFiles.forEach(filename => {
        test(`${filename}`, () => {
            testSpec(dirname, filename)
        })
    })
    
})


// test('test valid toml file', () => {
//     testSpec('test/data/valid', 'array-empty')
//     testSpec('test/data/valid', 'array-nospaces')
//     testSpec('test/data/valid', 'arrays-hetergeneous')
//     testSpec('test/data/valid', 'arrays-nested')
//     testSpec('test/data/valid', 'arrays')
//     testSpec('test/data/valid', 'bool')
//     testSpec('test/data/valid', 'comments-everywhere')
//     testSpec('test/data/valid', 'datetime')
//     testSpec('test/data/valid', 'empty')
//     testSpec('test/data/valid', 'example')
//     testSpec('test/data/valid', 'float')
//     testSpec('test/data/valid', 'implicit-and-explicit-after')
//     testSpec('test/data/valid', 'implicit-and-explicit-before')
//     testSpec('test/data/valid', 'implicit-groups')
//     testSpec('test/data/valid', 'integer')
//     testSpec('test/data/valid', 'key-equals-nospace')
//     testSpec('test/data/valid', 'key-space')
//     testSpec('test/data/valid', 'key-special-chars')
//     testSpec('test/data/valid', 'long-float')

//     /// FIXME: js native don't support big integer
//     // testSpec('test/data/valid', 'long-integer')

//     testSpec('test/data/valid', 'multiline-string')
//     testSpec('test/data/valid', 'raw-multiline-string')
//     testSpec('test/data/valid', 'raw-string')
//     testSpec('test/data/valid', 'string-empty')
//     testSpec('test/data/valid', 'string-escapes')
//     testSpec('test/data/valid', 'string-simple')
//     testSpec('test/data/valid', 'string-with-pound')
//     testSpec('test/data/valid', 'table-array-implicit')
//     testSpec('test/data/valid', 'table-array-many')
//     testSpec('test/data/valid', 'table-array-nest')
//     testSpec('test/data/valid', 'table-array-one')
//     testSpec('test/data/valid', 'table-empty')
//     testSpec('test/data/valid', 'table-sub-empty')
//     testSpec('test/data/valid', 'table-whitespace')
//     testSpec('test/data/valid', 'table-with-pound')
//     testSpec('test/data/valid', 'unicode-escape')
//     testSpec('test/data/valid', 'unicode-literal')
    
// })