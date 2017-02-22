/// using ava because alsatian don't give me stack trace when exception occured...

import test from 'ava';
import { Lexer, TokenType } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { ValueKind } from '../lib/ast'

function setup(input: string){
    let parser = new Parser(input)
    let root = parser.parse()
    return root
}

function setupForTestingValue(value: string){
    let input = `key = ${value}`
    let root = setup(input)
    return root.pairs[0].value
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
    let trueValue = setupForTestingValue("true")
    t.deepEqual(trueValue.kind, ValueKind.Boolean)
    t.deepEqual(trueValue.toString(), "true")

    let falseValue = setupForTestingValue("false")
    t.deepEqual(falseValue.kind, ValueKind.Boolean)
    t.deepEqual(falseValue.toString(), "false")   
})

test('parse value integer & float', t => {
    const testInt = (input, expected) => {
        let value = setupForTestingValue(input)
        t.deepEqual(value.kind, ValueKind.Integer)
        t.deepEqual(value.jsValue(), expected)
    }

    const testFloat = (input, expected) => {
        let value = setupForTestingValue(input)
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

