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

    assert.strictEqual(state.tokens.getGroups().length, 2)

    assert.deepEqual(state.tokens.getByValue('first'), { title: 'First', value: 'first' })
    assert.deepEqual(state.tokens.getByValue('last'), { title: 'last', value: 'last' })
    assert.deepEqual(state.tokens.getByValue('email'), { title: 'Email', value: 'email' })
  })
})
