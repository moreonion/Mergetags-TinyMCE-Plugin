export default class Ui {
  constructor (editor, core) {
    this.editor = editor
    this.core = core
  }

  /**
 * Register TinyMCE UI: icon, menu button and autocompleter.
 * @returns {void}
 */

  mount () {
    this.editor.ui.registry.addIcon('mergetags',
      '<svg width="24" height="24" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 5a2 2 0 0 1 1.6.8L21 12l-4.4 6.2a2 2 0 0 1-1.6.8h-3v-2h3l3.5-5L15 7H5v3H3V7c0-1.1.9-2 2-2h10Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 12a1 1 0 0 0-1 1v2H3a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2H7v-2c0-.6-.4-1-1-1Z"></path></svg>'
    )
    this.editor.ui.registry.addMenuButton('mergetags', {
      icon: 'mergetags',
      tooltip: 'Insert merge tag',

      fetch: (cb) => cb(this.core.getMenuItems())
    })

    this.editor.ui.registry.addNestedMenuItem('mergetags-menu', {
      text: 'Merge tags',
      getSubmenuItems: () => this.core.getMenuItems()
    })

    const config = {
      trigger: '{{',
      minChars: 0,
      columns: 1,
      matches: () => true,
      fetch: (pattern, maxResults) => Promise.resolve(this.core.autocomplete(pattern, maxResults)),
      onAction: (api, selectionRange, value) => {
        if (selectionRange) this.editor.selection.setRng(selectionRange)
        this.core.insertByValue(String(value))
        api.hide()
      }
    }

    this.editor.ui.registry.addAutocompleter('mergetags', config)
  }
}
