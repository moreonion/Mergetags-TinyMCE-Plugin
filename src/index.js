import Core from './core.js'
import Options from './options.js'
import TokenInteractions from './tokens/tokenInteractions.js'
import TokenRenderer from './tokens/tokenRenderer.js'
import TokenStore from './tokens/tokenStore.js'

/**
 * Register plugin with a TinyMCE instance.
 * Single public entry; internals are encapsulated behind `Core`.
 */
const registerMergetags = (tinymce) => {
  tinymce.PluginManager.add('mergetags', (editor) => {
    const options = new Options(editor.options)
    options.register()

    const tokens = new TokenStore()
    tokens.refreshFromOptions(options)

    const renderer = new TokenRenderer(options)
    const interactions = new TokenInteractions(
      editor,
      options,
      renderer,
      tokens,
    )

    const core = new Core(editor, options, tokens, renderer, interactions)
    core.mount()
    core.bindAll()

    return { getMetadata: () => ({ name: 'Merge Tags', version: '1.0.0' }) }
  })
}

// Auto-register if a global tinymce exists
;(() => {
  const t = (typeof window !== 'undefined' && window.tinymce) ? window.tinymce : null
  if (t) registerMergetags(t)
})()

export { registerMergetags }
