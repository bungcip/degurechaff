import * as ast from './ast'

export class JsonEmitter {
    constructor(){

    }

    emit(root: ast.Root): string {
        let rootObject = this.emitRoot(root)
        return JSON.stringify(rootObject)
    }

    private emitRoot(root: ast.Root): Object {
        let result = {}
        
        /// emit pair
        let pairs = this.emitPairs(root.pairs)
        Object.assign(result, pairs)

        /// emit table
        for(let table of root.tables){
            let tree = this.generateStructureFromName(result, table.name)
            let pairs = this.emitPairs(table.pairs)
            Object.assign(tree, pairs)
        }

        /// emit array of table
        for(let table of root.arrayOfTables){
            let array = this.generateStructureFromNameWithArrayAsLast(result, table.name)
            let pairs = this.emitPairs(table.pairs)
            array.push(...array)
        }

        return result
        
    }

    private emitPairs(pairs: ast.Pair[]): Object {
        let result = {}
        for(let pair of pairs){
            let key = pair.key.toString()
            let value = pair.value.jsValue()
            result[key] = value
        }

        return result
    }

    private generateStructureFromName(tree: Object, name: ast.Name): Object {
        let current = tree
        for(let segment of name.segments){
            let key = segment.value().toString()
            if(current.hasOwnProperty(key) === false){
                current[key] = {}
            }

            current = current[key]
        }

        return current
    }

    private generateStructureFromNameWithArrayAsLast(tree: Object, name: ast.Name): Array<any> {
        let current = tree
        let segments = Object.assign({}, name.segments)
        let lastSegment = segments.pop()

        for(let segment of segments){
            let key = segment.value().toString()
            if(current.hasOwnProperty(key) === false){
                current[key] = {}
            }

            current = current[key]
        }

        /// create array
        if(lastSegment === undefined){
            throw "unexpected lastSegment to be undefined"
        }

        let key = lastSegment.value.toString()
        if(current.hasOwnProperty(key) === false){
            current[key] = new Array<any>()
        }
        
        return current[key]
    }
}