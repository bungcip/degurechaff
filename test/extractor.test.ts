/// test dump json functionality
import {extractMultiLineString} from '../src/lib/extractor'

test("test blackslash newline with space", () => {
    const input = '"""\\\n"""';
    expect(extractMultiLineString(input)).toEqual("")
})

