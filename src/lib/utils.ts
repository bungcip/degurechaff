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
export function lookupObject(node: Object, segments: string[]): Object {
    let current = node
    for (const segment of segments) {
        if (current[segment] === undefined) {
            current[segment] = {}
        }
        current = current[segment]
    }

    /// return last element of array
    if(Array.isArray(current)){
        return current[current.length - 1]
    }

    return current
}

/**
 * lookup name inside Object structure and set to empty array when not exist
 */ 
export function lookupArray(node: Object, segments: string[]): [any] {
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

    return current[last]
}
