import { describe, test, assert } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import { createState } from '../state.js'
import { registerOptions } from '../settings.js'

describe('createState', () => {
  test('setTokens normalizes group structures and builds indices', () => {
    const editor = createEditorStub()
    registerOptions(editor)
    const state = createState(editor)

    state.setTokens([
      { title: 'User', items: [{ title: 'First', value: 'first' }, { value: 'last' }] },
      { title: 'Meta', menu: [{ title: 'Email', value: 'email' }] }
    ])

    assert.strictEqual(state.grouped.length, 2)
    assert.strictEqual(state.flat.length, 3)
    assert.isTrue(state.map.has('first'))
    assert.isTrue(state.map.has('last'))
    assert.isTrue(state.map.has('email'))
  })

  test('refreshFromOptions reads mergetags_list', () => {
    const editor = createEditorStub()
    registerOptions(editor)
    editor.options.set('mergetags_list', [{ title: 'A', items: [{ value: 'x' }] }])
    const state = createState(editor)
    state.refreshFromOptions()
    assert.strictEqual(state.flat[0].value, 'x')
  })

  test('nextUid increases and is base36 string', () => {
    const editor = createEditorStub()
    const state = createState(editor)
    const a = state.nextUid()
    const b = state.nextUid()
    assert.strictEqual(a, '1')
    assert.strictEqual(b, '2')
  })
})
