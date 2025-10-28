import State from './state.js'
import TokenRenderer from './tokens/tokenRenderer.js'
import ContentTransformer from './tokens/contentTransformer.js'
import TokenInteractions from './tokens/tokenInteractions.js'

/**
 * Core - Coordination layer and public API for the plugin.
 * Delegates to specialized classes instead of doing everything itself.
 * Owns: state, schema/styles installation, coordination between components.
 */
export default class Core {
  constructor (editor, options) {
    this.editor = editor
    this.options = options
    this.state = new State(options)

    this.renderer = new TokenRenderer(editor, options)
    this.transformer = new ContentTransformer(editor, options, this.renderer, this.state.tokens)
    this.interactions = new TokenInteractions(
      editor,
      options,
      this.renderer,
      this.state.tokens,
    )

    // Ensure tokens are ready on first load
    this.state.refreshFromOptions()
  }

  // Register schema + styles during PreInit
  installSchemaAndStyles () {
    this.editor.schema.addValidElements('span[class|contenteditable|data-mt-val]')
    const tokenClass = this.options.getTokenClass()
    const braceClass = this.options.getBraceClass()
    const activeClass = this.options.getActiveClass()
    this.editor.contentStyles.push(
      `.${tokenClass} .${braceClass}{color:#16a34a;font-weight:400;}`,
      `.${tokenClass}.${activeClass}{outline:3px solid rgba(0,125,126,.75);}`
    )
  }

  // Return menu items built from current groups
  getMenuItems () {
    return this.#buildMenuItems(this.state.tokens.getGroups())
  }

  // Insert tag by raw value (public convenience)
  insertByValue (value) {
    this.interactions.insertByValue(value)
  }

  // Update token set at runtime
  setTokens (data) {
    this.state.setTokens(data)
  }

  // Convert token `<span>` markup back to delimited text (`{{ value }}`)
  replaceTokensWithDelimiters (html) {
    return this.transformer.replaceTokensWithDelimiters(html)
  }

  // Convert delimited text (`{{ value }}`) to token `<span>` markup where possible
  replaceDelimitersWithTokens (html) {
    return this.transformer.replaceDelimitersWithTokens(html)
  }

  // Handle body clicks to activate tokens, or upgrade raw `{{ … }}` under caret
  onBodyClick (event) {
    this.interactions.onBodyClick(event)
  }

  // Build menu items recursively from token groups
  #buildMenuItems (items) {
    if (!Array.isArray(items) || !items.length) {
      return [{ type: 'menuitem', text: 'No tags', enabled: false }]
    }
    return items.map((item) => Array.isArray(item.menu)
      ? {
          type: 'nestedmenuitem',
          text: item.title || '',
          getSubmenuItems: () => this.#buildMenuItems(item.menu)
        }
      : {
          type: 'menuitem',
          text: item.title || item.value,
          onAction: () => this.interactions.insertTag({
            title: item.title || item.value,
            value: item.value
          })
        }
    )
  }
}
