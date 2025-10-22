import { describe, test, assert } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'

describe('Options', () => {
  test('registers defaults and getters return expected values', () => {
    const editor = createEditorStub()
    const options = new Options(editor)
    options.register()

    assert.strictEqual(options.getPrefix(), '{{')
    assert.strictEqual(options.getSuffix(), '}}')
    assert.strictEqual(options.getTokenClass(), 'mce-mergetag')
    assert.strictEqual(options.getBraceClass(), 'mce-mergetag-affix')
    assert.strictEqual(options.getActiveClass(), 'mt-active')
    assert.strictEqual(options.getDisplayMode(), 'value')
  })

  test('respects custom options', () => {
    const editor = createEditorStub()
    const options = new Options(editor)
    options.register()
    editor.options.set('mergetags_prefix', '[[')
    editor.options.set('mergetags_suffix', ']]')
    editor.options.set('mergetags_display', 'title')

    assert.strictEqual(options.getPrefix(), '[[')
    assert.strictEqual(options.getSuffix(), ']]')
    assert.strictEqual(options.getDisplayMode(), 'title')
  })
})
