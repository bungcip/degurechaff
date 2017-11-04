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

    return current
}

function lookupAot(node: Object, segments: string[]): [any] {
    let initials = segments.slice(0, segments.length - 2)
    let last = segments[segments.length - 1]

    let current = lookup(node, initials)
    if (current[last] === undefined) {
        current[last] = []
    }

    return current[last]
}



function testSpec(folder, filename){
    // const folder = 'data/valid'
    // const filename = 'array-empty'
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
    testSpec('test/data/valid', 'array-empty')
    testSpec('test/data/valid', 'array-nospaces')
    testSpec('test/data/valid', 'arrays-hetergeneous')
    testSpec('test/data/valid', 'arrays-nested')
    testSpec('test/data/valid', 'arrays')
    
})