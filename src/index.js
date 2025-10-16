import { bindEvents, registerCommands } from './events.js'
import { getters, registerOptions } from './settings.js'
import { createState } from './state.js'
import { makeCore } from './core.js'
import { registerUI } from './ui.js'

const registerMergetags = (tinymceInstance) => {
  tinymceInstance.PluginManager.add('mergetags', (editor) => {
    registerOptions(editor)
    const get = getters(editor)
    const state = createState(editor)
    const core = makeCore(editor, get, state)

    registerUI(editor, get, state, core)
    bindEvents(editor, get, state, core)
    registerCommands(editor, state, core)

    return {
      getMetadata: () => ({ name: 'Merge Tags (Self-hosted)', version: '1.0.0' }),
    }
  })
}

(() => {
  const tinymceGlobal = (typeof window !== 'undefined' && window.tinymce) ? window.tinymce : null
  if (tinymceGlobal) registerMergetags(tinymceGlobal)
})()

export { registerMergetags }
