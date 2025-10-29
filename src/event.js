export default class Event {
  constructor (editor, core) {
    this.editor = editor
    this.core = core
    this.containerClickHandler = null
  }

  // Bind all editor event handlers (PreInit, Get/SetContent, click).

  bindAll () {
    // Content transforms
    this.editor.on('GetContent', (e) => { e.content = this.core.replaceTokensWithDelimiters(e.content) })
    const inbound = (e) => { e.content = this.core.replaceDelimitersWithTokens(e.content) }
    this.editor.on('BeforeSetContent', inbound)
    this.editor.on('PastePreProcess', inbound)

    // Init / teardown
    this.editor.on('init', () => {
      const container = this.editor.getContainer()
      this.containerClickHandler = (ev) => this.core.onContainerClick(ev)
      container.addEventListener('click', this.containerClickHandler)
    })

    this.editor.on('remove', () => {
      const container = this.editor.getContainer()
      if (this.containerClickHandler) container.removeEventListener('click', this.containerClickHandler)
    })
  }
}
