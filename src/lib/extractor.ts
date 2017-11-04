import * as dt from './dt'

export function extractFloat(input: string): number {
    const value = input.replace(/_/g, '')
    return parseFloat(value)
}

/// get content between quote
export function extractLiteralString(input: string): string {
    const content = input.slice(1, input.length - 1)
    return content
}

export function extractString(input: string): string {
    /// replace \U{8} unicode escape
    const regex = /\\u([\d\w]{8})/gi;
    input = input.replace(regex, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16)); 
    });
    

    return JSON.parse(input)
}

export function extractMultiLineString(input: string): string {
    /// replace windows new line style to unix
    /// replace """\n with single "
    /// replace """ with single "
    const content1 = input.replace(/\r\n/g, "\n")
    const content2 = content1.replace('"""\n', '"""')
    const content3 = content2.slice(2, content2.length - 2)
    const content4 = content3.replace(/\\\n[\n ]*/g, "")
    const content5 = content4.replace(/\n/g, "\\n")

    // console.log("content3:",content3)
    // console.log("content4:",content4)
    // console.log("content5:",content5)

    return extractString(content5)
}

export function extractMultiLineLiteralString(input: string): string {
    /// replace windows new line style to unix
    /// replace '''\n with single '
    /// replace ''' with single '
    const content1 = input.replace(/\r\n/g, "\n")
    const content2 = content1.replace(`'''\n`, `'''`)
    const content3 = content2.slice(2, content2.length - 2)

    return extractLiteralString(content3)
}


export function extractDateTime(input: string): dt.DateTime {
    const [date, time] = input.split("T")
    const jsDate = extractDate(date)
    const jsTime = extractTime(time)
    const jsDt = new dt.DateTime(jsDate, jsTime)

    return jsDt
}

export function extractDate(input: string): dt.Date {
    const items = input.split('-').map(x => parseInt(x, 10))
    const [year, month, day] = items
    const date = new dt.Date(year, month, day)
    return date
}

/// NOTE: simplify this code!!!
export function extractTime(input: string): dt.Time {
    const items = input.substr(0, 8).split(':').map(x => parseInt(x, 10))
    const [hours, minutes, seconds] = items

    input = input.substr(8)

    let fractions: null | number = null
    let tzOffset: null | dt.TimeOffset = null

    if (input[0] === '.') {
        /// fractions
        input = input.substr(1)

        if (input.endsWith('Z')) {
            input = input.substr(0, input.length - 1)

            tzOffset = new dt.TimeOffset()
            fractions = parseInt(input, 10)
        } else {
            const plusIndex = input.indexOf('+')
            const minusIndex = input.indexOf('-')
            const partitionIndex = Math.max(plusIndex, minusIndex)

            if (partitionIndex === -1) {
                fractions = parseInt(input, 10)
            } else {
                const fractionInput = input.substr(0, partitionIndex)
                const tzInput = input.substr(partitionIndex)

                fractions = parseInt(fractionInput, 10)

                const pattern = /^([+-])(\d{2}):(\d{2})$/;
                // console.log(tzInput)
                const exprs = pattern.exec(tzInput)
                // console.log("exprs:", exprs)
                // console.log('part')
                if (exprs === null) {
                    throw new Error("extractTime(): unexpected null")
                }

                const sign = exprs[1] as dt.TimeOffsetSign
                const tzHour = parseInt(exprs[2], 10)
                const tzMin = parseInt(exprs[3], 10);
                tzOffset = new dt.TimeOffset(sign, tzHour, tzMin)
            }
        }
    } else if (input[0] === '+' || input[0] === '-') {
        /// only offset
        const sign = input[0] as dt.TimeOffsetSign
        const [tzHours, tzMinutes] = input.substr(1).split(':').map(x => parseInt(x, 10))
        tzOffset = new dt.TimeOffset(sign, tzHours, tzMinutes)
    } else if (input[0] === 'Z') {
        tzOffset = new dt.TimeOffset()
    }

    const time = new dt.Time(hours, minutes, seconds, fractions, tzOffset)
    return time
}
