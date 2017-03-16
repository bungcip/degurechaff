/// testing when parser error occurs

import test from 'ava';
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { ValueKind, AtomicValue, ArrayValue, Value, InlineTableValue } from '../lib/ast'
import * as dt from '../lib/dt'

function setup(input: string){
    const parser = new Parser(input)
    const root = parser.parse()
    return root
}


test("test parser on error: invalid pair", t => {
    const input = `just_key`
    const testError = (input) => {
        const root = setup(input)
    }

})