import * as ast from './ast'
import {Token, TokenType} from './token'
import {Lexer} from './lexer'

/// pratt parser
export class Parser {
    private input: string
    private lexer: Lexer
    private root: ast.Root
    private tokens: Token[]

    constructor(input: string){
        this.lexer = new Lexer(input)
        this.tokens = []
    }

    parse(): ast.Root {
        this.root = new ast.Root()

        while(this.eof() === false){
            let firstToken = this.peek(1)
            let secondToken = this.peek(2)

            if(firstToken.type == TokenType.LeftBracket){
                if(secondToken.type == TokenType.LeftBracket){
                    let aot = this.parseArrayOfTable()
                    this.root.arrayOfTables.push(aot)
                }else{
                    let table = this.parseTable()
                    this.root.tables.push(table)
                }
            }else{
                let pair = this.parsePair()
                this.root.pairs.push(pair)
            }
        }

        return this.root
    }

    private expect(tt: TokenType): Token {
        const token = this.advance()
        if(token.type != tt){
            console.trace("ok")
            throw "expect(): unexpected token found. get " + token.data
        }

        return token
    }

    private advanceIf(tt: TokenType): Token | false {
        let nextToken = this.peek()
        if(nextToken.type === tt){
            return this.advance()
        }
        return false
    }

    /**
     * Get next token without advancing current position
     */
    private peek(n: number = 1): Token {
        if(this.tokens.length < n){
            for(let i=0; i < n; i++){
                const token = this.lexer.next()
                this.tokens.push(token)
            }
        }

        return this.tokens[n - 1]
    }

    private advance(): Token {
        let token = this.tokens.shift()
        if(token === undefined){
            return this.lexer.next()
        }
        return token
    }

    public eof(): boolean {
        let token = this.peek()
        if(token.type == TokenType.EndOfFile){
            return true
        }

        return false
    }

    private parsePair(): ast.Pair {
        let key = this.parseKey()
        this.expect(TokenType.Equal)
        let value = this.parseValue()

        let node = new ast.Pair(key, value)
        return node
    }

    private parsePairs(): ast.Pair[] {
        let nodes: ast.Pair[] = []

        while(this.eof() === false){
            let nextToken = this.peek()
            if(nextToken.type == TokenType.LeftBracket){
                break
            }

            let pair = this.parsePair()
            nodes.push(pair)
        }

        return nodes
    }

    private parseKey(): ast.Key {
        let token = this.advance()
        let allowedTokens = [
            TokenType.Identifier,
            TokenType.BasicString,
            TokenType.LiteralString,
            TokenType.Integer
        ]
        if( allowedTokens.includes(token.type) === false ){
            // console.log(this.root.pairs)
            // console.trace("HORE")
            throw "parseKey(): unexpected token found, " + token.data
        }
        let node = new ast.Key(token)
        return node
    }

    /**
     * parse value fragment
     */
    private parseValue(): ast.AtomicValue | ast.ArrayValue | ast.InlineTableValue {
        let token = this.peek()
        switch(token.type){
            case TokenType.LeftBracket:
                return this.parseArray()
            case TokenType.LeftCurly:
                return this.parseInlineTable()
            default:
                return this.parseAtomic()
        }

    }

    parseAtomic(): ast.AtomicValue {
        let token = this.advance()
        let kind = ast.ValueKind.String
        switch(token.type){
            case TokenType.Integer:
                kind = ast.ValueKind.Integer
                break
            case TokenType.Float:
                kind = ast.ValueKind.Float
                break
            case TokenType.BasicString:
            case TokenType.LiteralString:
                kind = ast.ValueKind.String
                break
            case TokenType.Date:
            case TokenType.Time:
            case TokenType.DateTime:
                kind = ast.ValueKind.Date
                break
            case TokenType.Identifier:
                /// check for boolean value
                let text = token.data
                if(text == 'true' || text == 'false'){
                    kind = ast.ValueKind.Boolean
                    break
                }
                // fallthrough
            default:
                throw "parseAtomic(): unexpected token found '" + token.data + "'"
        }
        let node = new ast.AtomicValue(kind, token)
        return node
    }

    private parseArray(): ast.ArrayValue {
        this.expect(TokenType.LeftBracket)

        let items: ast.Value[] = []

        while(this.eof() === false){
            let nextToken = this.peek()
            switch(nextToken.type){
                case TokenType.RightBracket:
                    this.advance()
                    let node = new ast.ArrayValue(items)
                    return node
                default:
                    let value = this.parseValue()
                    items.push(value)
                    nextToken = this.peek()
                    switch(nextToken.type){
                        case TokenType.Comma:
                            this.advance()
                            continue
                        case TokenType.RightBracket:
                            continue
                        default:
                            throw 'parseArray(): expected , or ] but got ' + nextToken.data + ' instead'
                    }
            }
        }

        throw "EOF reached before token ] found"
    }

    private parseTable(): ast.Table {
        this.expect(TokenType.LeftBracket)
        let name = this.parseName()
        this.expect(TokenType.RightBracket)

        let node = new ast.Table()
        node.name = name
        node.pairs = this.parsePairs()

        return node
    }

    private parseName(): ast.Name {
        /// TODO: nested name 
        let token = this.expect(TokenType.Identifier)
        let node = new ast.Name([token])
        return node
    }

    private parseArrayOfTable(): ast.ArrayOfTable {
        this.expect(TokenType.LeftBracket)
        this.expect(TokenType.LeftBracket)
        
        let name = this.parseName()

        this.expect(TokenType.RightBracket)
        this.expect(TokenType.RightBracket)

        let node = new ast.ArrayOfTable()
        node.name = name
        node.pairs = this.parsePairs()

        return node
    }

    /// helper parser to parse between expression
    private surround<T>(begin: TokenType, end: TokenType, separator: TokenType, callback: () => T): T[] {
        this.expect(begin)

        let result: T[] = []
        while(this.peek().type !== end && this.eof() === false){
            let item = callback()
            result.push( item )
            
            let advanced = this.advanceIf(separator)
            if(advanced === false){
                break
            }
        }

        this.expect(end)
        return result
    }

    private parseInlineTable(): ast.InlineTableValue {
        let parsePair : () => ast.Pair = this.parsePair.bind(this)
        let pairs = this.surround(TokenType.LeftCurly, TokenType.RightCurly, TokenType.Comma, parsePair)
        let node = new ast.InlineTableValue(pairs)
        return node
    }

    private parseDate(){
//    date-fullyear   = 4DIGIT
//    date-month      = 2DIGIT  ; 01-12
//    date-mday       = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on
//                              ; month/year
//    time-hour       = 2DIGIT  ; 00-23
//    time-minute     = 2DIGIT  ; 00-59
//    time-second     = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second
//                              ; rules
//    time-secfrac    = "." 1*DIGIT
//    time-numoffset  = ("+" / "-") time-hour ":" time-minute
//    time-offset     = "Z" / time-numoffset

//    partial-time    = time-hour ":" time-minute ":" time-second
//                      [time-secfrac]
//    full-date       = date-fullyear "-" date-month "-" date-mday
//    full-time       = partial-time time-offset

//    date-time       = full-date "T" full-time        
    }

}