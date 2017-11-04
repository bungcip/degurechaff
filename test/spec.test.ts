/// Test to check degurechaff parser 
/// with toml-test data

import {parse} from '../src/degurechaff'
import * as ast from '../src/lib/chevAst'

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
        const currentObject = lookup(result, table.name.segments)
        // console.log("segments::", table.name.segments)
        // console.log("pairs::", table.pairs)
        dumpPairs(currentObject, table.pairs)
    }

    /// last array of table
    for (const aot of root.arrayOfTables) {
        const currentArray = lookupAot(result, aot.name.segments)
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


/// lookup name inside Object structure
function lookup(node: Object, segments: string[]): Object {
    let current = node
    for (const segment of segments) {
        if (current[segment] === undefined) {
            current[segment] = {}
        }
        current = current[segment]
    }

    /// return last element of array
    if(Array.isArray(current)){
        return current[current.length - 1]
    }

    return current
}

/// lookup name inside Object structure and set to empty array when not exist
function lookupAot(node: Object, segments: string[]): [any] {
    let initials = segments.slice(0, -1)
    let last = segments[segments.length - 1]
    let current = lookup(node, initials)

    // console.log(
    //     'node:', JSON.stringify(node), '\n',
    //     'current', JSON.stringify(current), '\n',
    //     'segments:', segments, 
    //     'initials:', initials, 
    //     'last:', last)

    if (current[last] === undefined) {
        current[last] = []
    }

    return current[last]
}



function testSpec(folder, filename){
    const tomlData = fs.readFileSync(`${folder}/${filename}.toml`, 'utf8')
    const jsonData = fs.readFileSync(`${folder}/${filename}.json`, 'utf8')

    const root = parse(tomlData)
    
    /// convert to test json data
    const expected = JSON.parse(jsonData)

    /// check AST
    const result = toJsonSpec(root)

    expect(result).toEqual(expected)
}



test('test valid toml file', () => {
    // testSpec('test/data/valid', 'array-empty')
    // testSpec('test/data/valid', 'array-nospaces')
    // testSpec('test/data/valid', 'arrays-hetergeneous')
    // testSpec('test/data/valid', 'arrays-nested')
    // testSpec('test/data/valid', 'arrays')
    // testSpec('test/data/valid', 'bool')
    // testSpec('test/data/valid', 'comments-everywhere')
    // testSpec('test/data/valid', 'datetime')
    // testSpec('test/data/valid', 'empty')
    // testSpec('test/data/valid', 'example')
    // testSpec('test/data/valid', 'float')
    // testSpec('test/data/valid', 'implicit-and-explicit-after')
    // testSpec('test/data/valid', 'implicit-and-explicit-before')
    // testSpec('test/data/valid', 'implicit-groups')
    // testSpec('test/data/valid', 'integer')
    // testSpec('test/data/valid', 'key-equals-nospace')
    // testSpec('test/data/valid', 'key-space')
    // testSpec('test/data/valid', 'key-special-chars')
    // testSpec('test/data/valid', 'long-float')

    /// FIXME: js native don't support big integer
    // testSpec('test/data/valid', 'long-integer')

    // testSpec('test/data/valid', 'multiline-string')
    // testSpec('test/data/valid', 'raw-multiline-string')
    // testSpec('test/data/valid', 'raw-string')
    // testSpec('test/data/valid', 'string-empty')
    // testSpec('test/data/valid', 'string-escapes')
    // testSpec('test/data/valid', 'string-simple')
    // testSpec('test/data/valid', 'string-with-pound')
    testSpec('test/data/valid', 'table-array-implicit')
    testSpec('test/data/valid', 'table-array-many')
    testSpec('test/data/valid', 'table-array-nest')
    
})