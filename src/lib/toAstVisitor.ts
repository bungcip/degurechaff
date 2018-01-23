import { parser } from "./chevParser"
import { CstNode, CstChildrenDictionary } from "chevrotain"
import * as ast from "./chevAst"
import * as extractor from './extractor'
import * as dt from "./dt"
import { isSameType } from "./utils";

export const BaseVisitor = parser.getBaseCstVisitorConstructor()

/**
 * Visitor to create valid AST from CST
 */
export class ToAstVisitor extends BaseVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    /**
     * convert value as array
     * @param value 
     */
    asArray(value?: any): Array<any> {
        if (value === undefined) {
            return []
        } else if (Array.isArray(value)) {
            return value
        } else {
            return [value]
        }
    }

    visitAll(nodes: CstNode[]): any[] {
        let result: any[] = []

        for (const node of nodes) {
            let value = this.visit(node)
            result.push(value)
        }

        return result
    }

    root(ctx: any) {
        let pairs = this.visit(ctx.pairs)
        const tables = this.visitAll(ctx.table)
        const arrayOfTables = this.visitAll(ctx.arrayOfTable)

        if (pairs === undefined) {
            pairs = []
        }

        /// FIXME: check if aot is duplicated...
        // console.log("cst aot length:", ctx.arrayOfTable.length)
        // console.log("ast aot length:", arrayOfTables.length)

        return new ast.Root(pairs, tables, arrayOfTables)
    }

    table(ctx: any) {
        const tableName = this.visit(ctx.tableName)
        const tableBody = this.asArray(this.visit(ctx.tableBody))

        return new ast.Table(tableName, tableBody)
    }

    arrayOfTable(ctx: any) {
        const tableName = this.visit(ctx.tableName)
        const tableBody = this.asArray(this.visit(ctx.tableBody))

        return new ast.ArrayOfTable(tableName, tableBody)
    }

    tableName(ctx: any) {
        const segments = this.visitAll(ctx.tableNameSegment)
        return new ast.Name(segments)
    }

    tableNameSegment(ctx: any): string {
        let result = ""
        if (ctx.Integer[0]) {
            result = ctx.Integer[0].image
        } else if (ctx.Float[0]) {
            const float = ctx.Float[0].image
            result = float.split(".")
        } else if (ctx.Identifier[0]) {
            result = ctx.Identifier[0].image
        } else if (ctx.BasicString[0]) {
            result = this.stringValue(ctx)
        } else if (ctx.LiteralString[0]) {
            result = this.stringValue(ctx)
        } else if (ctx.boolValue) {
            result = this.visit(ctx.boolValue).toString()
        }
        return result
    }

    tableBody(ctx: any): ast.Pair[] {
        return this.visit(ctx.pairs)
    }

    pairs(ctx: any): ast.Pair[] {
        const pairs : ast.Pair[] = this.visitAll(ctx.pair)

        /// check key must be unique
        const unique = []
        for(const pair of pairs){
            const exists = unique.includes(pair.key)
            if(exists === false){
                unique.push(pair.key)
            }else{
                /// TODO: accumulate all duplicated error...
                ///        currently it just throw on first error encountered
                throw new Error('Cannot redefining existing key: ' + pair.key)
            }
        }

        return pairs
    }

    pair(ctx: any) {
        const key = this.visit(ctx.key)
        const value = this.visit(ctx.value)

        return new ast.Pair(key, value)
    }

    key(ctx: any): string {
        let result = ""
        if (ctx.stringValue[0]) {
            result = this.visit(ctx.stringValue)
        } else if (ctx.Integer[0]) {
            result = ctx.Integer[0].image
        } else if (ctx.Identifier[0]) {
            result = ctx.Identifier[0].image
        } else if (ctx.boolValue[0]) {
            result = this.visit(ctx.boolValue).toString()
        }

        // console.log("key:: ", ctx)

        return result
    }

    value(ctx: any): ast.Value {
        let result
        let kind

        /// composite value
        if (ctx.arrayValue[0]) {
            const values = this.visit(ctx.arrayValue)
            return new ast.ArrayValue(values)
        } else if (ctx.inlineTableValue[0]) {
            const values = this.visit(ctx.inlineTableValue)
            return new ast.InlineTableValue(values)
        } 
        
        /// atomic value
        if (ctx.stringValue[0]) {
            kind = ast.AtomicValueKind.String
            result = this.visit(ctx.stringValue)
        } else if (ctx.numberValue[0]) {
            const numberCtx = ctx.numberValue[0].children
            if (numberCtx.Integer[0]) {
                kind = ast.AtomicValueKind.Integer
                result = extractor.extractFloat(numberCtx.Integer[0].image)
            } else if (numberCtx.Float[0]) {
                kind = ast.AtomicValueKind.Float
                result = extractor.extractFloat(numberCtx.Float[0].image)
            } else {
                throw new Error("unexpected token inside numberValue():" + JSON.stringify(numberCtx))
            }
        } else if (ctx.boolValue[0]) {
            kind = ast.AtomicValueKind.Boolean
            result = this.visit(ctx.boolValue)
        } else if (ctx.dateValue[0]) {
            kind = ast.AtomicValueKind.Date
            result = this.visit(ctx.dateValue)
        } else {
            throw new Error('unexpected token inside value():' + JSON.stringify(ctx))
        }

        return new ast.AtomicValue(kind, result)
    }

    boolValue(ctx: any): boolean {
        if (ctx.True[0]) {
            return true
        } else {
            return false
        }
    }

    stringValue(ctx: any) {
        let result = ""
        if (ctx.BasicString[0]) {
            result = extractor.extractString(ctx.BasicString[0].image)
        } else if (ctx.LiteralString[0]) {
            result = extractor.extractLiteralString(ctx.LiteralString[0].image)
        } else if (ctx.MultiLineBasicString[0]) {
            result = extractor.extractMultiLineString(ctx.MultiLineBasicString[0].image)
        } else if (ctx.MultiLineLiteralString[0]) {
            result = extractor.extractMultiLineLiteralString(ctx.MultiLineLiteralString[0].image)
        }

        return result
    }

    numberValue(ctx: any) {
        if (ctx.Integer[0]) {
            return extractor.extractFloat(ctx.Integer[0].image)
        } else if (ctx.Float[0]) {
            return extractor.extractFloat(ctx.Float[0].image)
        }

        throw new Error("unexpected token inside numberValue()")
    }

    dateValue(ctx: any) {
        if (ctx.Date[0]) {
            return extractor.extractDate(ctx.Date[0].image)
        } else if (ctx.Time[0]) {
            return extractor.extractTime(ctx.Time[0].image)
        } else if (ctx.DateTime[0]) {
            return extractor.extractDateTime(ctx.DateTime[0].image)
        }

        throw new Error("unexpected token inside dateValue()")
    }

    arrayValue(ctx: any): ast.Value[] {
        let values: ast.Value[] = this.visitAll(ctx.value)

        /// toml array element type must be uniform with first element
        if(values.length > 1){
            const firstElement = values[0]
            const isUniform = values.every(x => isSameType(firstElement, x))
            if(isUniform === false){
                const typeName = firstElement.typename()
                throw new Error(`Cannot have value with different type from ${typeName}`)
            }
        }


        return values
    }

    inlineTableValue(ctx: any): ast.Pair[] {
        let pairs = this.visitAll(ctx.pair)
        return pairs
    }
}