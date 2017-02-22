import * as ast from './ast'
import {Lexer, Token, TokenType} from './lexer'

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
                // console.log("tokens", this.tokens)
                // console.log("first token:", firstToken)
                // console.log("second token:", secondToken)

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
            throw "unexpected token found"
        }

        return token
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
            throw "parseKey(): unexpected token found"
        }
        let node = new ast.Key(token)
        return node
    }

    private parseValue(): ast.Value {
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
            case TokenType.Identifier:
                /// check for boolean value
                let text = token.data
                if(text == 'true' || text == 'false'){
                    kind = ast.ValueKind.Boolean
                    break
                }
                throw "parseValue() 1: not yet implemented"
            default:
                throw "parseValue() 2: not yet implemented"
        }

        let node = new ast.Value(kind, token)
        return node
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

}