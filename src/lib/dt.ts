export class Date {
    constructor(public year: number, public month: number, public day: number) { }
}

export type TimeOffsetSign = '+' | '-'
export class TimeOffset {
    public sign : TimeOffsetSign | null
    public hours : number
    public minutes: number

    constructor(sign?: TimeOffsetSign, hours: number = 0, minutes: number = 0){
        if(sign === undefined){
            this.sign = null
        }else{
            this.sign = sign
        }

        this.hours = hours
        this.minutes = minutes
    }
}

/**
 * Class for storing information about time without date
 */
export class Time {
    public fractions : number | null
    public offset: TimeOffset | null
    constructor(public hours: number, public minutes: number, public seconds: number, fractions: number | null = null, offset: TimeOffset | null = null) {
        this.fractions = fractions
        this.offset = offset
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

