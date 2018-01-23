import {JsObject, JsValue, Value, AtomicValue, AtomicValueKind, ArrayValue, InlineTableValue} from './chevAst'

export function objectSet(node: JsObject, segments: string[], value: any){
    let initials = segments.slice(0, -1)
    let last = segments[segments.length - 1]
    let head = lookupObject(node, initials)
    head[last] = value
}

export function arrayPush(node: JsObject, segments: string[], value: any){
    let initials = segments.slice(0, -1)
    let last = segments[segments.length - 1]
    let head = lookupObject(node, initials)
    
    if(head[last] === undefined){
        head[last] = []
    }

    const current = head[last]
    if(Array.isArray(current)){
        current.push(value)
    } else {
        throw new Error('arrayPush(): last item in segments is not array')
    }
}

/**
 * Lookup name inside Object structure and get the object.
 * 
 * If object is an array, it will return last item of the array
 * 
 * Example:
 * @example
 * const instance = {a:{b:{c:{d:0}}}}
 * lookupObject(instance, ['a', 'b, 'c', 'd']) // -> 0
 * lookupObject(instance, ['a', 'b, 'c']) // -> {d: 0}
 * lookupObject(instance, ['not_exist']) // -> {}
 * 
 */ 
export function lookupObject(node: JsObject, segments: string[]): JsObject {
    let current = node
    for (const segment of segments) {
        const segmentNode = current[segment]
        if (segmentNode === undefined) {
            current[segment] = {}
            current = current[segment] as JsObject
        }else if(Array.isArray(segmentNode)){
            current = segmentNode[segmentNode.length - 1]
        }else if(typeof segmentNode === 'object'){
            current = segmentNode
        }else{
            throw new Error('cannot lookup when the segment is not object')
        }
    }

    return current
} 

/**
 * lookup name inside Object structure and set to empty array when not exist
 */ 
export function lookupArray(node: JsObject, segments: string[]): [JsValue] {
    let initials = segments.slice(0, -1)
    let last = segments[segments.length - 1]
    let current = lookupObject(node, initials)

    // console.log(
    //     'node:', JSON.stringify(node), '\n',
    //     'current', JSON.stringify(current), '\n',
    //     'segments:', segments, 
    //     'initials:', initials, 
    //     'last:', last)

    if (current[last] === undefined) {
        current[last] = []
    }

    return current[last] as [JsValue]
}

/**
 * check if value is have same type
 */
export function isSameType(a: Value, b: Value): boolean {
    if(a instanceof AtomicValue && b instanceof AtomicValue && a.kind === b.kind){
        return true
    }else if(a instanceof ArrayValue && b instanceof ArrayValue){
        /// toml array is heterogenous
        return true
    }else if(a instanceof InlineTableValue && b instanceof InlineTableValue){
        /// FIXME: add check for its member
        return true
    }

    return false
}