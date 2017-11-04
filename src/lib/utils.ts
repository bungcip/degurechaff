import {JsObject, JsValue} from './chevAst'

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

    // /// return last element of array
    // if(Array.isArray(current)){
    //     return current[current.length - 1]
    // }

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
