import { editFile } from './edit-file'
import assert from 'assert'

const input = 'Red redder reddest'

describe('editFile', () => {
    it('returns identical output', () => {
        const output = editFile(input, 'foo', 'bar')
        assert.strictEqual(output, input)
    })

    it('replaces a string with a replacement', () => {
        const output = editFile(input, 'red', 'bar')
        assert.strictEqual(output, 'Red barder bardest')
    })

    it('replaces a string with a blank string', () => {
        const output = editFile(input, 'ed', '')
        assert.strictEqual(output, 'R rder rdest')
    })

    it('works with blank find string', () => {
        const output = editFile(input, '', 'foo')
        assert.strictEqual(output, input)
    })
})
