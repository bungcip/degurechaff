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
     * Fill internal token buffer from lexer instance.
     * It will ignore Token Comment for now
     */
    private fillBuffer(n: number){
        for(let i=0; i < n; i++){
            /// ignore comment token for now
            let token: Token
            do {
                token = this.lexer.next()
            } while( token.type == TokenType.Comment)

            this.tokens.push(token)
        }
    }

    /**
     * Get next token without advancing current position
     */
    private peek(n: number = 1): Token {
        if(this.tokens.length < n){
            this.fillBuffer(n)
        }

        return this.tokens[n - 1]
    }

    private advance(): Token {
        if(this.tokens.length < 1){
            this.fillBuffer(1)
        }

        /// this.tokens is guaranted to have minimun one element
        return this.tokens.shift() as Token
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
        const token = this.peek()
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
        const token = this.advance()
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
            case TokenType.MultiLineBasicString:
            case TokenType.MultiLineLiteralString:
                kind = ast.ValueKind.String
                break
            case TokenType.Date:
            case TokenType.Time:
            case TokenType.DateTime:
                kind = ast.ValueKind.Date
                break
            case TokenType.Identifier:
                /// check for boolean value
                const text = token.data
                if(text == 'true' || text == 'false'){
                    kind = ast.ValueKind.Boolean
                    break
                }
                // fallthrough
            default:
                throw "parseAtomic(): unexpected token found '" + token.data + "'"
        }
        const node = new ast.AtomicValue(kind, token)
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
                    const node = new ast.ArrayValue(items)
                    return node
                default:
                    const value = this.parseValue()
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
        const name = this.parseName()
        this.expect(TokenType.RightBracket)

        const node = new ast.Table()
        node.name = name
        node.pairs = this.parsePairs()

        return node
    }

    private parseName(): ast.Name {
        let segments: Token[] = []

        do {
            let token = this.expect(TokenType.Identifier)
            segments.push(token)
        } while(this.advanceIf(TokenType.Dot) )

        const node = new ast.Name(segments)
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


}