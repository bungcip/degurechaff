import {parser} from "./chevParser"
import {CstNode, CstChildrenDictionary} from "chevrotain"
import * as ast from "./chevAst"
import * as extractor from './extractor'
import * as dt from "./dt"

export const BaseVisitor = parser.getBaseCstVisitorConstructor()

/**
 * Visitor to create valid AST from CST
 */
export class ToAstVisitor extends BaseVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    orEmptyArray(value){
        if(value === undefined){
            return []
        }else if( value instanceof Array){
            return value
        }else {
            return [value]
        }
    }

    visitAll(nodes: CstNode[]): any[] {
        let result: any[] = []

        for(const node of nodes){
            let value = this.visit(node)
            result.push(value)
        }

        return result
    }

    root(ctx: any){
        const pairs = this.orEmptyArray( this.visit(ctx.pairs) )
        const tables = this.visitAll(ctx.table)
        const arrayOfTables = this.visitAll(ctx.arrayOfTable)

        /// FIXME: check if aot is duplicated...
        // console.log("cst aot length:", ctx.arrayOfTable.length)
        // console.log("ast aot length:", arrayOfTables.length)
        
        return new ast.Root(pairs, tables, arrayOfTables)
    }

    table(ctx: any){
        const tableName = this.visit(ctx.tableName)
        const tableBody = this.visit(ctx.tableBody)

        return new ast.Table(tableName, tableBody)
    }
    
    arrayOfTable(ctx: any){
        const tableName = this.visit(ctx.tableName)
        const tableBody = this.visit(ctx.tableBody)

        return new ast.ArrayOfTable(tableName, tableBody)
    }

    tableName(ctx: any){
        const nodes = this.orEmptyArray(this.visit(ctx.tableNameSegment))
        const segments: string[] = []

        /// FIXME: simplify this code
        for(const node of nodes){
            if(node instanceof Array){
                for(const n of node){
                    segments.push(n)
                }
            }else{
                segments.push(node)
            }
        }

        return new ast.Name(segments)
    }

    tableNameSegment(ctx: any){
        let result = ""
        if(ctx.stringValue){
            result = this.visit(ctx.stringValue)
        }else if(ctx.Integer[0]){
            result = ctx.Integer[0].image
        }else if(ctx.Float[0]){
            const float = ctx.Float[0].image
            result = float.split(".")
        }else if(ctx.Identifier[0]){
            result = ctx.Identifier[0].image
        }else if(ctx.LiteralString[0]){
            result = ctx.LiteralString[0].image
        }else if(ctx.boolValue){
            result = this.visit(ctx.boolValue)
        }
        return result
    }

    tableBody(ctx: any): ast.Pair[] {
        return this.orEmptyArray( this.visit(ctx.pairs) )
    }

    pairs(ctx: any){
        let result: any[] = []
        if(ctx.pair[0]){
            result.push( this.visit(ctx.pair) )
        }

        return result
    }

    pair(ctx: any){
        const key = this.visit(ctx.key)
        const value = this.visit(ctx.value)

        return new ast.Pair(key, value)        
    }

    key(ctx: any){
        /// FIXME: change to string because TOML key is must be string
        let result = ""
        if(ctx.stringValue[0]){
            result = this.visit(ctx.stringValue)
        }else if(ctx.Integer[0]){
            result = ctx.Integer[0].image
        }else if(ctx.Identifier[0]){
            result = ctx.Identifier[0].image
        }else if(ctx.boolValue[0]){
            result = this.visit(ctx.boolValue).toString()
        }

        // console.log("key:: ", ctx)

        return result
    }

    value(ctx: any){
        let result : any = null
        if(ctx.stringValue[0]){
            result = this.visit(ctx.stringValue)
        }else if(ctx.numberValue[0]){
            result = ctx.Integer[0].image
        }else if(ctx.boolValue[0]){
            result = this.visit(ctx.boolValue)
        }else if(ctx.arrayValue[0]){
            const values = this.visit(ctx.arrayValue)
            return new ast.ArrayValue(values)
        }else if(ctx.inlineTableValue[0]){
            result = this.visit(ctx.inlineTableValue)
        }else if(ctx.dateValue[0]){
            result = this.visit(ctx.dateValue)
        }

        return new ast.AtomicValue(result)
    }

    boolValue(ctx: any): boolean {
        if(ctx.True[0]){
            return true
        }else{
            return false
        }
    }

    stringValue(ctx: any){
        let result = ""
        if(ctx.BasicString[0]){
            result = extractor.extractString(ctx.BasicString[0].image)
        }else if(ctx.LiteralString[0]){
            result = extractor.extractLiteralString(ctx.LiteralString[0].image)
        }else if(ctx.MultiLineBasicString[0]){
            result = extractor.extractMultiLineString(ctx.MultiLineBasicString[0].image)
        }else if(ctx.MultiLineLiteralString[0]){
            result = extractor.extractMultiLineLiteralString(ctx.MultiLineLiteralString[0].image)
        }

        return result
    }

    numberValue(ctx: any){
        if(ctx.Integer[0]){
            return extractor.extractFloat(ctx.Integer[0].image)
        }else if(ctx.Float[0]){
            return extractor.extractFloat(ctx.Float[0].image)
        }

        throw "unexpected token inside numberValue()"
    }

    dateValue(ctx: any){
        if(ctx.Date[0]){
            return extractor.extractDate(ctx.Date[0].image)
        }else if(ctx.Time[0]){
            return extractor.extractTime(ctx.Time[0].image)
        }else if(ctx.DateTime[0]){
            return extractor.extractDateTime(ctx.DateTime[0].image)
        }

        throw "unexpected token inside dateValue()"
    }

    arrayValue(ctx: any){
        let values = this.visit(ctx.value)
        return values
    }

    inlineTableValue(ctx: any){
        let pairs = this.visit(ctx.pair)
        return pairs
    }
}