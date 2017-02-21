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
    t.deepEqual(table.name.segments[0].value, "empty-table")
    t.deepEqual(table.pairs.length, 0)
});


test('parse table with single pair', t => {
    let input = `
    [table]
        age = 20
    `
    let root = setup(input)
    let table = root.tables[0]
    t.deepEqual(table.name.segments[0].value, "table")
    t.deepEqual(table.pairs.length, 1)
    t.deepEqual(table.pairs[0].key.toString(), 'age')
    t.deepEqual(table.pairs[0].value.toString(), '20')
});


test('parse key boolean', t => {
    let trueValue = setupForTestingValue("true")
    t.deepEqual(trueValue.kind, ValueKind.Boolean)
    t.deepEqual(trueValue.toString(), "true")

    let falseValue = setupForTestingValue("false")
    t.deepEqual(falseValue.kind, ValueKind.Boolean)
    t.deepEqual(falseValue.toString(), "false")
    
})