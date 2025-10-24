export default class Event {
  constructor (editor, core) {
    this.editor = editor
    this.core = core
    this._bodyClickHandler = null
  }

  // Bind all editor event handlers (PreInit, Get/SetContent, click).

  bindAll () {
    // Load tokens + install schema/styles early
    this.editor.on('PreInit', () => {
      this.core.installSchemaAndStyles()
    })

    // Content transforms
    this.editor.on('GetContent', (e) => { e.content = this.core.replaceTokensWithDelimiters(e.content) })
    const inbound = (e) => { e.content = this.core.replaceDelimitersWithTokens(e.content) }
    this.editor.on('BeforeSetContent', inbound)
    this.editor.on('PastePreProcess', inbound)

    // Init / teardown
    this.editor.on('init', () => {
      const body = this.editor.getBody()
      this._bodyClickHandler = (ev) => this.core.onBodyClick(ev)
      body.addEventListener('click', this._bodyClickHandler)
    })

    this.editor.on('remove', () => {
      const body = this.editor.getBody()
      if (this._bodyClickHandler) body.removeEventListener('click', this._bodyClickHandler)
    })
  }
}
