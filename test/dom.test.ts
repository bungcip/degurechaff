import Dom from '../src/lib/dom'

test('dom basic key', () => {
    const dom = new Dom()

    dom.set('key-1', 20)
    dom.set('key-2', 'some-string')

    expect(dom.get('key-1')).toEqual(20)
    expect(dom.get('key-2')).toEqual('some-string')
})

test('dom duplicate key in table', () => {
    const dom = new Dom()

    dom.setOrFail(['fruit', 'type'], 'apple')

    expect(() => {
        dom.setOrFail(['fruit', 'type', 'apple'], 'yes')
    }).toThrow()
})

test('dom duplicate table name', () => {
    const dom = new Dom()

    dom.setOrFail('a', {})

    expect(() => {
        dom.setOrFail('a', {})
    }).toThrow()
})