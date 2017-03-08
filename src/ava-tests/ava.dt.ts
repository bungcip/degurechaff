/// testing datetime type
import test from 'ava';
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { ValueKind, AtomicValue, ArrayValue, Value, InlineTableValue } from '../lib/ast'
import * as dt from '../lib/dt'


test("test DateTime toString()", t => {
    {
        const input = new dt.DateTime(
            new dt.Date(1999, 1, 1),
            new dt.Time(1, 1, 1, 45,
                new dt.TimeOffset('+', 7, 30)
            )
        )

        const output = input.toString()

        t.deepEqual(output, "1999-01-01T01:01:01.45+07:30")
    }

    {
        const input = new dt.DateTime(
            new dt.Date(1999, 1, 1),
            new dt.Time(1, 1, 1, 45)
        )

        const output = input.toString()

        t.deepEqual(output, "1999-01-01T01:01:01.45")
    }

    {
        const input = new dt.DateTime(
            new dt.Date(1999, 1, 1),
            new dt.Time(1, 1, 1)
        )

        const output = input.toString()

        t.deepEqual(output, "1999-01-01T01:01:01")
    }
    
})

