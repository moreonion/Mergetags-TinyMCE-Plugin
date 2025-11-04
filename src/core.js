/**
 * Core - Coordination layer and public API for the plugin.
 * Delegates to specialized classes instead of doing everything itself.
 * Owns: tokens, schema/styles installation, coordination between components.
 */
export default class Core {
  constructor (editor, options, tokens, renderer, interactions) {
    this.editor = editor
    this.options = options
    this.tokens = tokens
    this.renderer = renderer
    this.interactions = interactions

    // Ensure tokens are ready on first load
  }

  bindAll () {
    // Content transforms
    this.editor.on('GetContent', (e) => { e.content = this.renderer.replaceTokensWithDelimiters(e.content) })
    const inbound = (e) => { e.content = this.renderer.replaceDelimitersWithTokens(e.content, this.tokens) }
    this.editor.on('BeforeSetContent', inbound)
    this.editor.on('PastePreProcess', inbound)

    // Init / teardown
    this.editor.on('init', () => {
      const container = this.editor.getContainer()
      this.containerClickHandler = (event) => this.interactions.activateTokenOnClick(event)
      container.addEventListener('click', this.containerClickHandler)
    })

    this.editor.on('remove', () => {
      const container = this.editor.getContainer()
      if (this.containerClickHandler) container.removeEventListener('click', this.containerClickHandler)
    })
  }

  mount () {
    const autocompleteConfig = {
      trigger: this.options.getPrefix(),
      minChars: 0,
      columns: 1,
      matches: () => true,
      fetch: (pattern, maxResults) => Promise.resolve(this.tokens.autocomplete(pattern, maxResults)),
      onAction: (api, selectionRange, value) => {
        if (selectionRange) this.editor.selection.setRng(selectionRange)
        this.interactions.insertByValue(String(value))
        api.hide()
      }
    }

    // ui registers
    this.editor.ui.registry.addIcon('mergetags',
      '<svg width="24" height="24" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 5a2 2 0 0 1 1.6.8L21 12l-4.4 6.2a2 2 0 0 1-1.6.8h-3v-2h3l3.5-5L15 7H5v3H3V7c0-1.1.9-2 2-2h10Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 12a1 1 0 0 0-1 1v2H3a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2H7v-2c0-.6-.4-1-1-1Z"></path></svg>'
    )
    this.editor.ui.registry.addMenuButton('mergetags', {
      icon: 'mergetags',
      tooltip: 'Insert merge tag',

      fetch: (cb) => cb(this.tokens.buildMenuItems(this.interactions))
    })

    this.editor.ui.registry.addNestedMenuItem('mergetags-menu', {
      text: 'Merge tags',
      getSubmenuItems: () => this.tokens.buildMenuItems(this.interactions)
    })

    this.editor.ui.registry.addAutocompleter('mergetags', autocompleteConfig)
  }
}
