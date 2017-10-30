/// test dump json functionality
import {dump} from '../src/degurechaff'
import {exceptions} from 'chevrotain';

test("test dump() json when invalid input", () => {
    const input = "[";
    expect(() => dump(input)).toThrow()
})

test("test dump() table", () => {
    const input = `[a]
    a="fg"`;
    expect(dump(input)).toEqual({
        a: {
            a: 'fg'
        }
    })
})