/// TOML Document Object Model
import * as ast from './chevAst'
import { objectSet, arrayPush, lookupObject } from './utils'

export default class Dom {
    _content: ast.JsObject

    constructor() {
        this._content = {}
    }

    set(key: string | string[] | ast.Name, value: ast.JsValue) {
        key = this.convertToArrayString(key)
        objectSet(this._content, key, value)
    }

    setOrFail(key: string | string[] | ast.Name, value: ast.JsValue) {
        const segments = this.convertToArrayString(key)
        const initials = segments.slice(0, -1)
        const head = lookupObject(this._content, initials)
        const last = segments[segments.length - 1]

        if (head[last] !== undefined) {
            throw new Error('Duplicate name of ' + last)
        }

        head[last] = value
    }

    get(key: string | string[] | ast.Name): any {
        const segments = this.convertToArrayString(key)

        let head: ast.JsObject
        if (segments.length === 1) {
            head = this._content
        } else {
            head = lookupObject(this._content, segments)
        }

        let last = segments[segments.length - 1]
        return head[last]
    }

    private convertToArrayString(key: string | string[] | ast.Name): string[] {
        if (typeof key === 'string') {
            key = [key]
        } else if (key instanceof ast.Name) {
            key = key.segments
        }

        return key
    }

}