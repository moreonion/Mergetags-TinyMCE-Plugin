import { describe, test, assert } from 'vitest'
import { registerMergetags } from '../index.js'
import { createEditorStub } from './helpers/editorStub.js'

describe('registerMergetags', () => {
  test('registers plugin and exposes getMetadata', () => {
    const editor = createEditorStub()
    const tinymce = {
      PluginManager: {
        _plugins: {},
        add: function (name, factory) { this._plugins[name] = factory(editor) }
      }
    }
    registerMergetags(tinymce)
    assert.ok(tinymce.PluginManager._plugins.mergetags)
    const api = tinymce.PluginManager._plugins.mergetags
    const meta = api.getMetadata()
    assert.strictEqual(meta.name, 'Merge Tags (Self-hosted)')
  })
})
