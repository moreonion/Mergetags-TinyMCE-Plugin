import Core from './core.js'
import Event from './event.js'
import Ui from './ui.js'
import Options from './options.js'

/**
 * Register plugin with a TinyMCE instance.
 * Single public entry; internals are encapsulated behind `Core`.
 */
const registerMergetags = (tinymce) => {
  tinymce.PluginManager.add('mergetags', (editor) => {
    // Options (needed for PreInit)
    const options = new Options(editor)
    options.register()

    // Core (owns state and all transforms)
    const core = new Core(editor, options)

    // Thin integration layers (depend only on editor + core)
    const ui = new Ui(editor, core)
    const events = new Event(editor, core)

    // Wire up
    ui.mount()
    events.bindAll()

    return { getMetadata: () => ({ name: 'Merge Tags (Self-hosted)', version: '1.0.0' }) }
  })
}

// Auto-register if a global tinymce exists
;(() => {
  const t = (typeof window !== 'undefined' && window.tinymce) ? window.tinymce : null
  if (t) registerMergetags(t)
})()

export { registerMergetags }
