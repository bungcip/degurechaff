/// testing json emitter
import {dump} from '../src/degurechaff';


function setupEmitter(input: string, expected: Object): void {
    let json = dump(input)
    expect(json).toEqual( expected)
}

test("emit json:pair", () => {
    let input = `name = 'value'`
    let expected = {
        'name': 'value'
    }
    setupEmitter(input, expected)
})

test("emit json: date value", () => {
    let input = `name = 1979-05-27T07:32:00-08:00`
    let expected = {
        'name': '1979-05-27T07:32:00-08:00'
    }
    setupEmitter(input, expected)
})

test("emit json: multi line string", () => {
    let input = `
str1 = """Roses are red
Violets are blue"""

str2 = """
The quick brown \\
   fox jumps over \\
     the lazy dog."""

str3 = '''
The first newline is
trimmed in raw strings.
   All other whitespace
   is preserved.
'''
`
     let expected = {
         'str1': 'Roses are red\nViolets are blue',
         'str2': 'The quick brown fox jumps over the lazy dog.',
         'str3': 'The first newline is\ntrimmed in raw strings.\n   All other whitespace\n   is preserved.\n'
     }
     setupEmitter(input, expected)
})



test("emit json: table", () => {
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
    setupEmitter(input, expected)

})


test("emit json: nested table", () => {
    let input = `
            [profile]
                name = "Foo Bar"
                age = 20
            [profile.address]
                home = "near"
                count = 2
        `
    let expected = {
        'profile': {
            'name': "Foo Bar",
            'age': 20,
            'address': {
                'home': 'near',
                'count': 2
            }
        },
    }
    setupEmitter(input, expected)

})

test("emit json: array of table", () => {
    let input = `
            [[fruits]]
                name = "Apple"
            [[fruits]]
                name = "Orange"
        `
    let expected = {
        'fruits': [
            {'name': 'Apple'},
            {'name': 'Orange'},
        ],
    }
    setupEmitter(input, expected)
})