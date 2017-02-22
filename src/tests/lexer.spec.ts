import { Expect, Test, TestCase } from "alsatian"
import { Lexer, TokenType } from '../lib/lexer'

export class LexerTest {

    @Test("lexer single token integer")
    @TestCase("9", "9")
    @TestCase("12345", "12345")
    @TestCase("1234567890", "1234567890")
    @TestCase("5555abc", "5555")
    @TestCase("   5555", "5555")
    @TestCase("+22", "+22")
    @TestCase("-75", "-75")
    @TestCase("+44_55_66", "+44_55_66")
    public integerTest(input: string, expected: string) {
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.Integer)
        Expect(token.data).toBe(expected)
    }

// # fractional
// flt1 = +1.0
// flt2 = 3.1415
// flt3 = -0.01

// # exponent
// flt4 = 5e+22
// flt5 = 1e6
// flt6 = -2E-2

// # both
// flt7 = 6.626e-34

// flt8 = 9_224_617.445_991_228_313

    @Test("lexer token number value")
    @TestCase("+1.0", TokenType.Float, +1.0)
    @TestCase("3.1415", TokenType.Float, 3.1415)
    @TestCase("-0.01", TokenType.Float, -0.01)
    public numberJsValue(input: string, tt: TokenType, expected: number){
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(tt)
        Expect(token.jsValue()).toBe(expected)
    }


    @Test("lexer single token comment")
    @TestCase("# Just Comment #", "# Just Comment #")
    @TestCase("   #####\nhello", "#####")
    @TestCase("   #####\r\nhello", "#####")
    public commentTest(input: string, expected: string) {
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.Comment)
        Expect(token.data).toBe(expected)
    }

    @Test("lexer comment token on second")
    @TestCase("4000 # Just Comment\n400", "# Just Comment")
    public commentOnSecondToken(input: string, expected: string){
        let lexer = new Lexer(input)
        /// discard first token
        lexer.next()

        let token = lexer.next()
        Expect(token.type).toBe(TokenType.Comment)
        Expect(token.data).toBe(expected)
    }


    @Test("lexer simple token")
    @TestCase("([{}])", [
        TokenType.LeftParen, TokenType.LeftBracket, TokenType.LeftCurly,
        TokenType.RightCurly, TokenType.RightBracket, TokenType.RightParen
    ])
    @TestCase("= . ,", [TokenType.Equal, TokenType.Dot, TokenType.Comma])
    public simpleToken(input: string, expecteds: [TokenType]){
        let lexer = new Lexer(input)
        for(let expected of expecteds){
            let token = lexer.next()
            Expect(token.type).toBe(expected)
        }
    }

    @Test("lexer identifier token")
    @TestCase("name", "name")
    @TestCase("some_name", "some_name")
    @TestCase("min-size", "min-size")
    @TestCase("_leading_underscore", "_leading_underscore")
    @TestCase("SCREAMING", "SCREAMING")
    public identifierTest(input: string, expected: string){
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.Identifier)
        Expect(token.data).toBe(expected)
    }

    @Test("lexer basic string token")
    @TestCase('"name"', '"name"')
    @TestCase('"complex string and number (0-9_)+ [{}]"', '"complex string and number (0-9_)+ [{}]"')
    public basicStringTest(input: string, expected: string){
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.BasicString)
        Expect(token.data).toBe(expected)
    }

    @Test("lexer basic string escape")
    @TestCase(`"\\b\\t\\f\\r\\"\\"`, `"\\b\\t\\f\\r\\"\\"`)
    @TestCase(`"\\n"`, `"\\n"`)
    public basicStringEscapeTest(input: string, expected: string){
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.BasicString)
        Expect(token.data).toBe(expected)
    }

    @Test("lexer literal string token")
    @TestCase("'C:\\Users\\nodejs\\templates'","'C:\\Users\\nodejs\\templates'")
    public literalStringTest(input: string, expected: string){
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.LiteralString)
        Expect(token.data).toBe(expected)
    }

    
}