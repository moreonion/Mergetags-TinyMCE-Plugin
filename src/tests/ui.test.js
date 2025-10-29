import { describe, test, assert, vi } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import Core from '../core.js'
import Ui from '../ui.js'

describe('Ui.mount', () => {
  const setup = () => {
    const editor = createEditorStub()
    const options = new Options(editor)
    options.register()
    const core = new Core(editor, options)
    core.setTokens([{ title: 'Group', menu: [{ title: 'First', value: 'first' }, { title: 'Last', value: 'last' }] }])
    return { editor, options, core }
  }

  test('registers icon and menu button', () => {
    const { editor, core } = setup()
    const ui = new Ui(editor, core)
    ui.mount()
    assert.ok(editor._icons.mergetags)
    assert.ok(editor._menuButtons.mergetags)
  })

  test('autocompleter fetches and onAction inserts by value', async () => {
    const { editor, core } = setup()
    const insertSpy = vi.spyOn(core, 'insertByValue')
    const ui = new Ui(editor, core)
    ui.mount()

    const ac = editor._autocompleters.mergetags
    const items = await ac.fetch('', 10)
    assert.ok(Array.isArray(items))
    assert.isTrue(items.length >= 1)

    const api = { hide: vi.fn() }
    ac.onAction(api, null, 'first')
    assert.isTrue(insertSpy.mock.calls.length >= 1)
    assert.isTrue(api.hide.mock.calls.length >= 1)
  })
})
