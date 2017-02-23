import { Expect, Test, TestCase } from "alsatian"
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'

export class ParserTest extends Parser {
    @Test("eof")
    eofTest(){
        let input = "name"
        let parser = new Parser(input)
        Expect(parser.eof()).toBe(false)
    }

    @Test("parse pair")
    parsePairTest(){
        let input = "name = 'value'"
        let parser = new Parser(input)

        console.log("Hore")
        let root = parser.parse()

        let pair = root.pairs[0]
        Expect(pair.key.toString()).toBe("name")
        Expect(pair.value.toString()).toBe("value")
    }
}