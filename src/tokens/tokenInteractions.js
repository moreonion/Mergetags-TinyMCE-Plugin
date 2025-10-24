// TokenInteractions - Manages user interactions with tokens; owns insertion, activation, click handling, raw token upgrading
export default class TokenInteractions {
  constructor (editor, options, renderer, tokens, format) {
    this.editor = editor
    this.options = options
    this.renderer = renderer
    this.tokens = tokens
    this.format = format
  }

  // Clear active class from all tokens
  clearActiveTokens () {
    const body = this.editor.getBody()
    const tokenClass = this.options.getTokenClass()
    const active = this.options.getActiveClass()
    body.querySelectorAll(`span.${tokenClass}.${active}`).forEach((n) => n.classList.remove(active))
  }

  // Activate (highlight) a token element; @param {HTMLElement} tokenEl
  activateToken (tokenEl) {
    this.clearActiveTokens()
    tokenEl.classList.add(this.options.getActiveClass())
    this.editor.selection.select(tokenEl)
    this.editor.selection.collapse(false)
  }

  // Insert a token at current selection; @param {{ title?: string, value: string }} tag
  insertTag (tag) {
    this.editor.undoManager.transact(() => {
      const el = this.renderer.createTokenElement(tag)
      this.editor.selection.setNode(el)
      if (this.options.highlightOnInsert()) this.activateToken(el)
    })
  }

  // Insert tag by raw value (convenience method); @param {string} value
  insertByValue (value) {
    const tag = this.tokens.getByValue(value)
    if (tag) this.insertTag(tag)
  }

  // Get token ancestor element for a given node; @param {Node} node; @returns {HTMLElement|null}
  getTokenAncestor (node) {
    const tokenClass = this.options.getTokenClass()
    return this.editor.dom.getParent(node, (cand) =>
      cand && cand.nodeType === 1 && this.editor.dom.hasClass(cand, tokenClass)
    )
  }

  // Attempt to upgrade raw delimited text under caret to a token element; @returns {boolean} True if upgrade succeeded
  upgradeRawUnderCaret () {
    const rng = this.editor.selection?.getRng()
    const start = rng?.startContainer

    const textNode = start?.nodeType === Node.TEXT_NODE
      ? start
      : [...(start?.childNodes ?? [])].find(n => n.nodeType === Node.TEXT_NODE)

    if (!textNode) return false

    const re = this.format.getDelimiterRegex()
    const full = textNode.nodeValue
    const match = re.exec(full)
    if (!match) return false

    const inner = String(match[1])
    const tag = this.tokens.getByValue(inner)
    if (!tag) return false

    this.editor.undoManager.transact(() => {
      this.replaceMatchedTextWithToken(textNode, full, match, tag)
    })
    return true
  }

  // Replace matched delimiter segment with rendered token element
  replaceMatchedTextWithToken (textNode, fullText, match, tag) {
    const textBeforeMatch = fullText.slice(0, match.index)
    const textAfterMatch = fullText.slice(match.index + match[0].length)
    const parentNode = textNode.parentNode
    const tokenElement = this.renderer.createTokenElement(tag)
    const editorDoc = this.editor.getDoc()
    if (textBeforeMatch) parentNode.insertBefore(editorDoc.createTextNode(textBeforeMatch), textNode)
    parentNode.insertBefore(tokenElement, textNode)
    if (textAfterMatch) parentNode.insertBefore(editorDoc.createTextNode(textAfterMatch), textNode)
    parentNode.removeChild(textNode)
    this.activateToken(tokenElement)
  }

  // Handle body clicks to activate tokens or upgrade raw delimiters; @param {MouseEvent} event
  onBodyClick (event) {
    const tokenEl = this.getTokenAncestor(event.target)
    if (tokenEl) {
      event.preventDefault()
      this.activateToken(tokenEl)
      return
    }
    if (this.upgradeRawUnderCaret()) return
    this.clearActiveTokens()
  }
}
