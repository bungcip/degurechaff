/// testing datetime type
import * as dt from '../src/lib/dt'


test("full datetime", () => {
    const input = new dt.DateTime(
        new dt.Date(1999, 1, 1),
        new dt.Time(1, 1, 1, 45,
            new dt.TimeOffset('+', 7, 30)
        )
    )

    const output = input.toString()

    expect(output).toEqual("1999-01-01T01:01:01.45+07:30")

})

test("test datetime without timezone", () => {
    const input = new dt.DateTime(
        new dt.Date(1999, 1, 1),
        new dt.Time(1, 1, 1, 45)
    )

    const output = input.toString()

    expect(output).toEqual("1999-01-01T01:01:01.45")
})

test("test datetime simple", () => {
    const input = new dt.DateTime(
        new dt.Date(1999, 1, 1),
        new dt.Time(1, 1, 1)
    )

    const output = input.toString()

    expect(output).toEqual("1999-01-01T01:01:01")

})
