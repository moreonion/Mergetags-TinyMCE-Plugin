export default class Event {
  constructor (editor, core) {
    this.editor = editor
    this.core = core
    this._bodyClickHandler = null
  }

  /**
 * Bind all editor event handlers (PreInit, Get/SetContent, click).
 * @returns {void}
 */

  bindAll () {
    // Load tokens + install schema/styles early
    this.editor.on('PreInit', this.core.refreshTokensFromOptions)
    this.editor.on('PreInit', this.core.installSchemaAndStyles)

    // Content transforms
    this.editor.on('GetContent', (e) => { e.content = this.core.replaceTokensWithDelimiters(e.content) })
    const inbound = (e) => { e.content = this.core.replaceDelimitersWithTokens(e.content) }
    this.editor.on('BeforeSetContent', inbound)
    this.editor.on('PastePreProcess', inbound)

    // Token behavior
    this.editor.on('keydown', (e) => {
      const selNode = this.editor.selection?.getNode()
      const tokenEl = this.core.getTokenAncestor(selNode)
      if (!tokenEl) return
      e.preventDefault()
      this.editor.undoManager.transact(() => tokenEl.remove())
    })

    this.editor.on('NodeChange', (e) => {
      const tokenEl = this.core.getTokenAncestor(e.element)
      if (tokenEl) {
        this.editor.selection.select(tokenEl)
        this.editor.selection.collapse(false)
      }
    })

    // Init / teardown
    this.editor.on('init', () => {
      const body = this.editor.getBody()
      this._bodyClickHandler = (ev) => this.core.onBodyClick(ev)
      body.addEventListener('click', this._bodyClickHandler)
      setTimeout(this.core.transformInitialContentOnce, 0)
    })

    this.editor.on('LoadContent', this.core.transformInitialContentOnce)

    this.editor.on('remove', () => {
      const body = this.editor.getBody()
      if (this._bodyClickHandler) body.removeEventListener('click', this._bodyClickHandler)
    })
  }
}
