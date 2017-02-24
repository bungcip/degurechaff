import { Expect, Test, TestCase } from "alsatian"
import { TokenType } from '../lib/token'
import { Lexer } from '../lib/lexer'
import { Parser } from '../lib/parser'
import { JsonEmitter } from '../lib/jsonEmitter'


export class JsonEmitterTest extends Parser {
    setupJs(input, expected){
        let parser = new Parser(input)
        let root = parser.parse()

        let emitter = new JsonEmitter()
        let jsonString = emitter.emit(root)
        let json = JSON.parse(jsonString)

        Expect(json).toEqual(expected)
    }

    @Test("emit json: pair")
    emitJsonPairTest(){
        let input = `name = 'value'`
        let expected = {
            'name': 'value'
        }
        this.setupJs(input, expected)
    }

    @Test("emit json: table")
    emitJsonTableTest(){
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
            'database' : {
                'server': "192.168.1.1",
                'ports': [ 8001, 8001, 8002 ],
                'connection_max': 5000,
                'enabled': true
            },
            'clients': {
                'data': [["gamma", "delta"], [1, 2] ]
            }
        }
        this.setupJs(input, expected)
    }
    
}