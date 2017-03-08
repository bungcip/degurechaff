/// testing json emitter
import test from 'ava';
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { ValueKind, AtomicValue, ArrayValue, Value, InlineTableValue } from '../lib/ast'
import * as dt from '../lib/dt'
import { JsonEmitter } from '../lib/jsonEmitter'


function setupEmitter(input, expected, t) {
    let parser = new Parser(input)
    let root = parser.parse()

    let emitter = new JsonEmitter()
    let jsonString = emitter.emit(root)
    let json = JSON.parse(jsonString)

    t.deepEqual(json, expected)
}

test("emit json:pair", t => {
    let input = `name = 'value'`
    let expected = {
        'name': 'value'
    }
    setupEmitter(input, expected, t)
})

test("emit json: date value", t => {
    let input = `name = 1979-05-27T07:32:00-08:00`
    let expected = {
        'name': '1979-05-27T07:32:00-08:00'
    }
    setupEmitter(input, expected, t)
})

test("emit json: table", t => {
    let input = `
            [database]
            server = "192.168.1.1"
            ports = [ 8001, 8001, 8002 ]
            connection_max = 5000
            enabled = true

            [clients]
            data = [ ["gamma", "delta"], [1, 2] ]
        `
    let expected = {
        'database': {
            'server': "192.168.1.1",
            'ports': [8001, 8001, 8002],
            'connection_max': 5000,
            'enabled': true
        },
        'clients': {
            'data': [["gamma", "delta"], [1, 2]]
        }
    }
    setupEmitter(input, expected, t)

})
