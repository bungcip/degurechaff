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
            let token = this.peek()
            // console.log("token = ", token)
            switch(token.type){
                case TokenType.LeftBracket:
                    let table = this.parseTable()
                    this.root.tables.push(table)
                    break
                default:
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

    private peek(n: number = 1): Token {
        if(this.tokens.length == 0){
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


    protected parseKey(): ast.Key {
        let token = this.advance()
        let allowedTokens = [
            TokenType.Identifier,
            TokenType.BasicString,
            TokenType.LiteralString,
            TokenType.Integer
        ]
        if( allowedTokens.includes(token.type) === false ){
            throw "unexpected token found"
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
            case TokenType.BasicString:
            case TokenType.LiteralString:
                kind = ast.ValueKind.String
                break
            default:
                throw "parseValue(): not yet implemented"
        }

        let node = new ast.Value(kind, token)
        return node
    }

    private parseTable(): ast.Table {
        this.expect(TokenType.LeftBracket)
        let name = this.parseName()
        this.expect(TokenType.RightBracket)

        let table = new ast.Table()
        table.name = name

        while(this.eof() === false){
            let nextToken = this.peek()
            if(nextToken.type == TokenType.LeftBracket){
                break
            }

            let pair = this.parsePair()
            table.pairs.push(pair)
        }

        return table
    }

    private parseName(): ast.Name {
        /// TODO: nested name 
        let token = this.expect(TokenType.Identifier)
        let node = new ast.Name([token])
        return node
    }

}