import * as utils from '../src/lib/utils'
import { isSameType } from '../src/lib/utils';
import { AtomicValue, AtomicValueKind, ArrayValue } from '../src/lib/chevAst';

// [[a]]
// [[a.b]]
//     [a.b.c]
//         d = "val0"
// [[a.b]]
//     [a.b.c]
//         d = "val1"

// {
//     "a": [
//       {
//         "b": [
//           { "c" : { "d": {"type": "string", "value": "val0" } } },
//           { "c" : { "d": {"type": "string", "value": "val1" } } }
//         ]
//       }
//     ]
//   }
  

// test('lookupObject: array-object-array-object', () => {
//     const data = {}

//     utils.arrayPush(data, ['a'], {})
//     // utils.arrayPush()
// })

test('isSameType: boolean', () => {
    const a = new AtomicValue(AtomicValueKind.Boolean, false)
    const b = new AtomicValue(AtomicValueKind.Boolean, true)
    const c = new AtomicValue(AtomicValueKind.Integer, 0)

    expect(isSameType(a, b)).toEqual(true)
    expect(isSameType(a, c)).toEqual(false)
    expect(isSameType(b, c)).toEqual(false)
})

test('isSameType: array', () => {
    const a = new ArrayValue([
        new AtomicValue(AtomicValueKind.Boolean, false),
        new AtomicValue(AtomicValueKind.Boolean, true),
    ])
    const b = new ArrayValue([
        new AtomicValue(AtomicValueKind.Boolean, false),
        new AtomicValue(AtomicValueKind.Boolean, false),
    ])
    const c = new ArrayValue([
        new AtomicValue(AtomicValueKind.Integer, 0),
        new AtomicValue(AtomicValueKind.Integer, 2),
    ])
    const d = new AtomicValue(AtomicValueKind.Integer, 0)

    expect(isSameType(a, b)).toEqual(true)

    /// toml allow heterogenous array
    expect(isSameType(a, c)).toEqual(true)
    expect(isSameType(b, c)).toEqual(true)

    expect(isSameType(a, d)).toEqual(false)
    expect(isSameType(c, d)).toEqual(false)
})