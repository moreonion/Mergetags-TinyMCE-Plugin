export default class Commands {
  constructor (editor, core) {
    this.editor = editor
    this.core = core
  }

  /**
 * Register TinyMCE commands: `mergetags:insert` and `mergetags:setTokens`.
 *
 * - `mergetags:insert` — inserts a tag by its `value`.
 *   @command mergetags:insert
 *   @param {any} ui - (TinyMCE internal)
 *   @param {{value?: string}|string} data - Tag value or `{ value }` shape.
 * - `mergetags:setTokens` — replaces the token list and retokenizes.
 *   @command mergetags:setTokens
 *   @param {any} ui - (TinyMCE internal)
 *   @param {Array<object>} data - New tokens list (same shape as `mergetags_list`).
 * @returns {void}
 */

  register () {
    this.editor.addCommand('mergetags:insert', (ui, data) => {
      const value = data && (data.value || data)
      this.core.insertByValue(String(value))
    })

    this.editor.addCommand('mergetags:setTokens', (ui, data) => {
      this.core.setTokens(data)
      this.core.retokenizeEditorContent()
    })
  }
}
