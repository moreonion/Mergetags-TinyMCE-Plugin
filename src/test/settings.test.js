import { describe, test, assert } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import { registerOptions, getters } from '../settings.js'

describe('registerOptions + getters', () => {
  test('registers defaults and returns getters', () => {
    const editor = createEditorStub()
    registerOptions(editor)
    const get = getters(editor)

    assert.strictEqual(get.getPrefix(), '{{')
    assert.strictEqual(get.getSuffix(), '}}')
    assert.strictEqual(get.getTrigger(), '{{')
    assert.strictEqual(get.getTokenClass(), 'mce-mergetag')
    assert.strictEqual(get.getBraceClass(), 'mce-mergetag-affix')
    assert.strictEqual(get.getActiveClass(), 'mt-active')
    assert.strictEqual(get.getMaxSuggestions(), 100)
    assert.strictEqual(get.getDisplayMode(), 'value')
    assert.strictEqual(get.showBraces(), true)
  })

  test('respects custom options and fallback trigger', () => {
    const editor = createEditorStub()
    registerOptions(editor)
    editor.options.set('mergetags_prefix', '<<')
    editor.options.set('mergetags_suffix', '>>')
    editor.options.set('mergetags_trigger', '')
    editor.options.set('mergetags_show_braces', false)
    editor.options.set('mergetags_display', 'title')

    const get = getters(editor)
    assert.strictEqual(get.getPrefix(), '<<')
    assert.strictEqual(get.getSuffix(), '>>')
    assert.strictEqual(get.getTrigger(), '{{')
    assert.strictEqual(get.showBraces(), false)
    assert.strictEqual(get.getDisplayMode(), 'title')
  })
})
