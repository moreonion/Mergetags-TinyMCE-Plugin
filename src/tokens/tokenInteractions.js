// TokenInteractions - Manages user interactions with tokens; owns insertion, activation, click handling
export default class TokenInteractions {
  constructor (editor, options, renderer, tokens) {
    this.editor = editor
    this.tokenClass = options.getTokenClass()
    this.activeClass = options.getActiveClass()
    this.renderer = renderer
    this.tokens = tokens
  }

  // Clear active class from all tokens
  clearActiveTokens () {
    const body = this.editor.getBody()
    const { tokenClass, activeClass } = this
    body.querySelectorAll(`.${tokenClass}.${activeClass}`)
      .forEach((el) => el.classList.remove(activeClass))
  }

  // Activate (highlight) a token element
  activateToken (tokenEl) {
    this.clearActiveTokens()
    tokenEl.classList.add(this.activeClass)
    this.editor.selection.select(tokenEl)
    this.editor.selection.collapse(false)
  }

  // Insert a token at current selection
  insertTag (tag) {
    this.editor.undoManager.transact(() => {
      const el = this.renderer.createTokenElement(tag)
      this.editor.selection.setNode(el)
    })
  }

  // Insert tag by raw value (convenience method)
  insertByValue (value) {
    const token = this.tokens.getByValue(value)
    if (token) this.insertTag(token)
  }

  // Get token ancestor element for a given node
  getTokenAncestor (node) {
    return node.closest('.' + this.tokenClass)
  }

  // Handle body clicks to activate tokens
  activateTokenOnClick (event) {
    const tokenEl = this.getTokenAncestor(event.target)
    if (!tokenEl) return this.clearActiveTokens()
    event.preventDefault()
    this.activateToken(tokenEl)
  }
}
