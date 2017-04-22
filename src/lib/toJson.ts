import {parser} from "./chevParser"
import {CstNode, CstChildrenDictionary} from "chevrotain"
import * as ast from "./chevAst"
import * as extractor from './extractor'


/// convert AST root node to JSON compatible object structure
export function toJson(root: ast.Root) : Object {
    const result = {}

    /// convert pair first
    dumpPair(result, root.pairs)

    /// then tables
    for(const table of root.tables){
        const currentObject = lookup(result, table.name.segments)
        dumpPair(currentObject, table.pairs)
    }

    /// last array of table
    for(const aot of root.arrayOfTables){
        const currentArray = lookupAot(result, aot.name.segments)
        // console.log("dump pairs::", aot.pairs)
        const newObject = {}
        dumpPair(newObject, aot.pairs)

        currentArray.push(newObject)
    }

    return result
}

function dumpPair(node: Object, pairs: ast.Pair[]){
    // console.log("pairs ::", pairs)
    for(const pair of pairs){
        const key = pair.key
        const value = pair.value.jsValue()
        node[key] = value
    }
}

/// lookup name inside Object structure
function lookup(node: Object, segments: string[]): Object {
    let current = node
    for(const segment of segments){
        if(node[segment] === undefined){
            node[segment] = {}
        }
        current = node[segment]
    }

    return current
}

function lookupAot(node: Object, segments: string[]): [any] {
    let initials = segments.slice(0, segments.length - 2)
    let last = segments[segments.length - 1]

    let current = lookup(node, initials)
    if(current[last] === undefined){
        current[last] = []
    }

    return current[last]
}