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
    @TestCase("+34_55", "+34_55")
    public integerTest(input: string, expected: string) {
        let lexer = new Lexer(input)
        let token = lexer.next()
        Expect(token.type).toBe(TokenType.Integer)
        Expect(token.value).toBe(expected)
    }
}