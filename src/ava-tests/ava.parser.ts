/// using ava because alsatian don't give me stack trace when exception occured...

import test from 'ava';
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { ValueKind, AtomicValue, ArrayValue, Value, InlineTableValue } from '../lib/ast'
import * as dt from '../lib/dt'

function setup(input: string){
    let parser = new Parser(input)
    let root = parser.parse()
    return root
}


/// NOTE: Help needed
/// how can I merge this three function as generic function in typescript?

function setupForTestingAtomicValue(value: string): AtomicValue {
    let input = `key = ${value}`
    let root = setup(input)
    let node = root.pairs[0].value
    if(node instanceof AtomicValue){
        return node
    }

    throw "value is not AtomicValue"
}

function setupForTestingArrayValue(value: string): ArrayValue {
    let input = `key = ${value}`
    let root = setup(input)
    let node = root.pairs[0].value
    if(node instanceof ArrayValue){
        return node
    }

    throw "value is not ArrayValue"
}

function setupForTestingInlineTableValue(value: string): InlineTableValue {
    let input = `key = ${value}`
    let root = setup(input)
    let node = root.pairs[0].value
    if(node instanceof InlineTableValue){
        return node
    }

    throw "value is not InlineTableValue"
}



function setupForTestingKey(key: string){
    let input = `${key} = true`
    let root = setup(input)
    return root.pairs[0].key
}


test('parse pair', t => {
    let root = setup('name = "value"')
    let pair = root.pairs[0]
    t.deepEqual(pair.key.toString(), "name")
    t.deepEqual(pair.value.toString(), "value")
});

test('parse two pair', t => {
    let input = `
        name = "value"
        "foo" = 20
    `
    let root = setup(input)
    t.deepEqual(root.pairs.length, 2)

    {
        let pair = root.pairs[0]
        t.deepEqual(pair.key.toString(), "name")
        t.deepEqual(pair.value.toString(), "value")
    }

    {
        let pair = root.pairs[1]
        t.deepEqual(pair.key.toString(), "foo")
        t.deepEqual(pair.value.toString(), "20")

    }
})

test('parse empty table', t => {
    let root = setup('[empty-table]')
    let table = root.tables[0]
    t.deepEqual(table.name.segments[0].data, "empty-table")
    t.deepEqual(table.pairs.length, 0)
});


test('parse table with single pair', t => {
    let input = `
    [table]
        age = 20
    `
    let root = setup(input)
    let table = root.tables[0]
    t.deepEqual(table.name.segments[0].data, "table")
    t.deepEqual(table.pairs.length, 1)
    t.deepEqual(table.pairs[0].key.toString(), 'age')
    t.deepEqual(table.pairs[0].value.toString(), '20')
});

test('parse empty array of table', t => {
    let root = setup('[[array-of-table]]\n[[array-of-table]]\n[[array-of-table]]')
    t.deepEqual(root.arrayOfTables.length, 3)

    let aot = root.arrayOfTables[0]
    t.deepEqual(aot.name.segments[0].data, "array-of-table")
    t.deepEqual(aot.pairs.length, 0)
});

test('parse array of table with single pair', t => {
    let input = `
    [[item]]
        free = false
    `
    let root = setup(input)
    t.deepEqual(root.arrayOfTables.length, 1)

    let aot = root.arrayOfTables[0]
    t.deepEqual(aot.name.segments[0].data, "item")
    t.deepEqual(aot.pairs.length, 1)
});


test('parse value boolean', t => {
    let trueValue = setupForTestingAtomicValue("true")
    t.deepEqual(trueValue.kind, ValueKind.Boolean)
    t.deepEqual(trueValue.toString(), "true")

    let falseValue = setupForTestingAtomicValue("false")
    t.deepEqual(falseValue.kind, ValueKind.Boolean)
    t.deepEqual(falseValue.toString(), "false")   
})

test('parse value integer & float', t => {
    const testInt = (input, expected) => {
        let value = setupForTestingAtomicValue(input)
        t.deepEqual(value.kind, ValueKind.Integer)
        t.deepEqual(value.jsValue(), expected)
    }

    const testFloat = (input, expected) => {
        let value = setupForTestingAtomicValue(input)
        t.deepEqual(value.kind, ValueKind.Float)
        t.deepEqual(value.jsValue(), expected)
    }

    testInt("+1_2_3_4_5_6_7_8_9_0", 1234567890)
    testInt("1e6", 1e6)
    testInt("-2E-2", -2E-2);
    testInt("5e+22", 5e+22)

    testFloat("+1.0", +1.0)
    testFloat("3.1415", 3.1415)
    testFloat("-0.01", -0.01)

    testFloat("6.626e-34", 6.626e-34);
})

test('parse value array', t => {
    const testArray = (input, expected) => {
        let value = setupForTestingArrayValue(input)
        t.deepEqual(value.jsValue(), expected)
    }

    testArray("[]", [])
    testArray("[1]", [1])
    testArray("[1,2,3]", [1,2,3])
    testArray("[1,2,3,]", [1,2,3])

    testArray("[[1],[2],[3],]", [[1],[2],[3]])

})


test('parse value date', t => {
    const testDate = (input, expected) => {
        let value = setupForTestingAtomicValue(input)
        t.deepEqual(value.kind, ValueKind.Date)
        t.deepEqual(value.jsValue(), expected)
    }

    testDate("1979-05-27", new dt.Date(1979, 5, 27))
    testDate("11:30:05", new dt.Time(11, 30, 5))
    testDate("1979-05-27T11:30:05", dt.DateTime.fromNumber(1979, 5, 27, 11, 30, 5))
    testDate("1979-05-27T11:30:05.999999", dt.DateTime.fromNumber(1979, 5, 27, 11, 30, 5, 999999))

    const testDateWithOffset = (input, expected) => {
        let [years, month, day, hours, minutes, seconds, fractions, tzOffset] = expected
        let instant = new dt.DateTime(
            new dt.Date(years, month, day),
            new dt.Time(hours, minutes, seconds, fractions, tzOffset)
        )
        testDate(input, instant)
    }

    ///
    testDateWithOffset("1979-05-27T11:30:05Z", [1979, 5, 27, 11, 30, 5, null, new dt.TimeOffset()])
    testDateWithOffset("1979-05-27T00:32:00-07:00", [1979, 5, 27, 0, 32, 0, null, new dt.TimeOffset('-', 7, 0)])
    testDateWithOffset("1979-05-27T11:30:05.999999+11:00", [1979, 5, 27, 11, 30, 5, 999999, new dt.TimeOffset('+', 11, 0)])
})


test("parse value inline table", t => {
    const testTable = (input, expected) => {
        let value = setupForTestingInlineTableValue(input)
        t.deepEqual(value.jsValue(), expected)
    }

    testTable("{}", {})
    testTable("{a = 20}", {'a': 20})
    testTable("{a = 20, b = 30, c = 40}", {'a': 20, 'b': 30, 'c': 40})
})

test("parse key",  t => {
    const testId = (input, expected) => {
        let key = setupForTestingKey(input)
        t.deepEqual(key.toString(), expected)
    }

    /// bare key
    testId('abcdefghijklmnopqrstuvwxyz', 'abcdefghijklmnopqrstuvwxyz')
    testId('1234567890', '1234567890')
    testId('abc123', 'abc123')
    testId('bare_key', 'bare_key')
    testId('bare-key', 'bare-key')

    /// quoted key
    testId(`"127.0.0.1"`, '127.0.0.1')
    testId(`"character encoding"`, 'character encoding')
    testId(`"ʎǝʞ"`, 'ʎǝʞ')
    testId(`'key2'`, 'key2')
    testId(`'quoted "value"'`, 'quoted "value"')
})
