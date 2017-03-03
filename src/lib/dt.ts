export class Date {
    constructor(public year: number, public month: number, public day: number) { }
}

/**
 * Class for storing information about time without date
 */
export class Time {
    public fractions : number | null
    constructor(public hours: number, public minutes: number, public seconds: number, fractions: number | null = null) {
        this.fractions = fractions
    }
}

export class DateTime {
    constructor(public date: Date, public time: Time) { }
    static fromNumber(year: number, month: number, day: number, hours: number, minutes: number, seconds: number, fractions?: number) {
        let date = new Date(year, month, day)
        let time = new Time(hours, minutes, seconds, fractions)
        return new DateTime(date, time)
    }
}

