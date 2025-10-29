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
    this.state = new State(options)
    this.renderer = new TokenRenderer(options)
    this.transformer = new ContentTransformer(options, this.renderer, this.state.tokens)
    this.interactions = new TokenInteractions(
      editor,
      options,
      this.renderer,
      this.state.tokens,
    )

    // Ensure tokens are ready on first load
    this.state.refreshFromOptions()
  }

  // Insert tag by raw value
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
  onContainerClick (event) {
    this.interactions.onContainerClick(event)
  }
}
