import { describe, test, assert, vi } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import { registerOptions, getters } from '../settings.js'
import { createState } from '../state.js'
import { registerUI } from '../ui.js'

const setup = () => {
  const editor = createEditorStub()
  registerOptions(editor)
  const get = getters(editor)
  const state = createState(editor)
  state.setTokens([{ title: 'Group', menu: [{ title: 'First', value: 'first' }, { title: 'Last', value: 'last' }] }])
  const core = {
    buildMenuItems: () => [{ type: 'menuitem', text: 'dummy', onAction: () => {} }],
    insertTag: vi.fn()
  }
  return { editor, get, state, core }
}

describe('registerUI', () => {
  test('registers icon and menu button', () => {
    const { editor, get, state, core } = setup()
    registerUI(editor, get, state, core)
    assert.ok(editor._icons.mergetags)
    assert.ok(editor._menuButtons.mergetags)
  })

  test('autocompleter filters and onAction inserts tag', async () => {
    const { editor, get, state, core } = setup()
    registerUI(editor, get, state, core)

    const ac = editor._autocompleters.mergetags
    assert.strictEqual(ac.trigger, get.getTrigger())
    const results = await ac.fetch('fir', 5)
    assert.isAtMost(results.length, 2)
    const rng = document.createRange()
    rng.selectNodeContents(editor.getBody())
    editor.selection.setRng(rng)
    await ac.onAction({ hide () {} }, rng, 'first')
    assert.isTrue(core.insertTag.mock.calls.length > 0)
  })
})
