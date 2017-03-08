import test from 'ava';
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { ValueKind, AtomicValue, ArrayValue, Value, InlineTableValue } from '../lib/ast'
import * as dt from '../lib/dt'

test("single token integer", t => {
    const setup = (input, expected) => {
        let lexer = new Lexer(input)
        let token = lexer.next()
        t.deepEqual(token.type, TokenType.Integer)
        t.deepEqual(token.data, expected)
    }

    setup("9", "9")
    setup("12345", "12345")
    setup("1234567890", "1234567890")
    setup("   5555", "5555")
    setup("+22", "+22")
    setup("-75", "-75")
    setup("+44_55_66", "+44_55_66")
})

test("single token float", t => {
    const setup = (input, expected) => {
        let lexer = new Lexer(input)
        let token = lexer.next()
        t.deepEqual(token.type, TokenType.Float)
        t.deepEqual(token.value(), expected)
    }

    setup("+1.0", +1.0)
    setup("3.1415", 3.1415)
    setup("-0.01", -0.01)

})



test("comment token", t => {
    const setup = (input, expected) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.Comment)
        t.deepEqual(token.data, expected)
    }

    setup("# Just Comment #", "# Just Comment #")
    setup("   #####\nhello", "#####")
    setup("   #####\r\nhello", "#####")
})


test("comment token on second", t => {
    const setup = (input, expected) => {
        let lexer = new Lexer(input)
        /// discard first token
        lexer.next()

        const token = lexer.next()
        t.deepEqual(token.type, TokenType.Comment)
        t.deepEqual(token.data, expected)
    }

    setup("4000 # Just Comment\n400", "# Just Comment")
})

test("simple token", t => {
    const setup = (input, expecteds) => {
        const lexer = new Lexer(input)
        for (const expected of expecteds) {
            const token = lexer.next()
            t.deepEqual(token.type, expected)
        }
    }

    setup("([{}])", [
        TokenType.LeftParen, TokenType.LeftBracket, TokenType.LeftCurly,
        TokenType.RightCurly, TokenType.RightBracket, TokenType.RightParen
    ])
    setup("= . ,", [TokenType.Equal, TokenType.Dot, TokenType.Comma])


})

test("identifier token", t => {
    const setup = (input) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.Identifier)
        t.deepEqual(token.data, input)
    }
    setup("name")
    setup("some_name")
    setup("min-size")
    setup("_leading_underscore")
    setup("SCREAMING")
})


test("basic string token", t => {
    const setup = (input) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.BasicString)
        t.deepEqual(token.data, input)
    }
    setup('"name"')
    setup('"complex string and number (0-9_)+ [{}]"')


})

test("basic string escape", t => {
    const setup = (input) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.BasicString)
        t.deepEqual(token.data, input)
    }
    setup(`"\\b\\t\\f\\r\\"\\"`)
    setup(`"\\n"`)
})

test("basic string escape unicode", t => {
    const setup = (input) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.BasicString)
        t.deepEqual(token.data, input)
    }
    setup(`"\\u005Cu"`)
    setup(`"\\u0075"`)
})


test("multi line basic string", t => {
    const setup = (input, expected) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.MultiLineBasicString)
        t.deepEqual(token.value(), expected)
    }
    setup(`"""Roses are red\nViolets are blue"""`, "Roses are red\nViolets are blue")
})

test("multi line basic string with line ending backslash", t => {
    const setup = (input, expected) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.MultiLineBasicString)
        t.deepEqual(token.value(), expected)
    }

    setup(
        `"""\nThe quick brown \\\n\n\n  fox jumps over \\\n    the lazy dog."""`, 
        'The quick brown fox jumps over the lazy dog.'
    )

})



test("literal string token", t => {
    const setup = (input) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.LiteralString)
        t.deepEqual(token.data, input)
    }
    setup("'C:\\Users\\nodejs\\templates'")

})


test("multi line literal string token", t => {
    const setup = (input) => {
        const lexer = new Lexer(input)
        const token = lexer.next()
        t.deepEqual(token.type, TokenType.MultiLineLiteralString)
        t.deepEqual(token.data, input)
    }
    setup(`'''I [dw]on't need \\d{2} apples'''`)
    setup(`'''\nThe first newline is\ntrimmed in raw strings.\n   All other whitespace\n    is preserved.'''`)

})