/// we need builtin leftpad...
const zeroPad = (x: number) => {
    let result = x.toString()
    if (result.length == 1) {
        return `0${result}`
    }
    return result
}



export class Date {
    constructor(public year: number, public month: number, public day: number) { }

    toString(): string {
        return `${zeroPad(this.year)}-${zeroPad(this.month)}-${zeroPad(this.day)}`
    }
}

export type TimeOffsetSign = '+' | '-'
export class TimeOffset {
    public sign: TimeOffsetSign | null
    public hours: number
    public minutes: number

    constructor(sign?: TimeOffsetSign, hours: number = 0, minutes: number = 0) {
        if (sign === undefined) {
            this.sign = null
        } else {
            this.sign = sign
        }

        this.hours = hours
        this.minutes = minutes
    }

    toString() {
        if (this.sign === null) {
            return 'Z'
        }

        const result = `${this.sign}${zeroPad(this.hours)}:${zeroPad(this.minutes)}`
        return result
    }
}

/**
 * Class for storing information about time without date
 */
export class Time {
    public fractions: number | null
    public offset: TimeOffset | null
    constructor(public hours: number, public minutes: number, public seconds: number, fractions: number | null = null, offset: TimeOffset | null = null) {
        this.fractions = fractions
        this.offset = offset
    }

    toString(): string {
        let hourString = zeroPad(this.hours)
        let minuteString = zeroPad(this.minutes)
        let secondString = zeroPad(this.seconds)

        let timeString = `${hourString}:${minuteString}:${secondString}`
        if (this.fractions) {
            timeString += `.${this.fractions}`
        }

        if (this.offset) {
            timeString += this.offset.toString()
        }

        return timeString
    }
}

export class DateTime {
    constructor(public date: Date, public time: Time) { }
    static fromNumber(year: number, month: number, day: number, hours: number, minutes: number, seconds: number, fractions?: number) {
        const date = new Date(year, month, day)
        const time = new Time(hours, minutes, seconds, fractions)
        return new DateTime(date, time)
    }

    toString(): string {
        const dateString = this.date.toString()
        const timeString = this.time.toString()

        return `${dateString}T${timeString}`
    }
}

