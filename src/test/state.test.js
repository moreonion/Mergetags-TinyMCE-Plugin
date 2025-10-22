import { describe, test, assert } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import State from '../state.js'
import Options from '../options.js'

describe('State', () => {
  test('setTokens normalizes group structures and builds indexes', () => {
    const editor = createEditorStub()
    const options = new Options(editor)
    options.register()
    const state = new State(options)

    state.setTokens([
      { title: 'User', items: [{ title: 'First', value: 'first' }, { value: 'last' }] },
      { title: 'Meta', menu: [{ title: 'Email', value: 'email' }] }
    ])

    assert.strictEqual(state.groupedTokens.length, 2)
    assert.strictEqual(state.flatTokens.length, 3)
    assert.isTrue(state.valueMap.has('first'))
    assert.isTrue(state.valueMap.has('last'))
    assert.isTrue(state.valueMap.has('email'))
  })

  test('nextUid increases and is base36 string-ish', () => {
    const editor = createEditorStub()
    const options = new Options(editor)
    options.register()
    const state = new State(options)
    const a = state.nextUid()
    const b = state.nextUid()
    assert.notStrictEqual(a, b)
    assert.match(a, /^[0-9a-z]+$/)
    assert.match(b, /^[0-9a-z]+$/)
  })
})
