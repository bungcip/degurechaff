import { parser } from "./chevParser"
import { CstNode, CstChildrenDictionary } from "chevrotain"
import * as ast from "./chevAst"
import * as extractor from './extractor'
import { lookupArray, lookupObject } from './utils'


/// convert AST root node to JSON compatible object structure
export function toJson(root: ast.Root): Object {
    const result = {}

    /// convert pair first
    if(root.pairs !== undefined){
        dumpPairs(result, root.pairs)
    }

    /// then tables
    for (const table of root.tables) {
        const currentObject = lookupObject(result, table.name.segments)
        // console.log("segments::", table.name.segments)
        // console.log("pairs::", table.pairs)
        dumpPairs(currentObject, table.pairs)
    }

    /// last array of table
    for (const aot of root.arrayOfTables) {
        const currentArray = lookupArray(result, aot.name.segments)
        // console.log("dump pairs::", aot.pairs)
        const newObject = {}
        dumpPairs(newObject, aot.pairs)

        currentArray.push(newObject)
    }

    return result
}

function dumpPairs(node: Object, pairs: ast.Pair[]) {
    // console.log("pairs ::", pairs)
    for (const pair of pairs) {
        const key = pair.key
        const value = pair.value.jsValue()
        node[key] = value
    }
}
