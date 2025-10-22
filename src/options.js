export default class Options {
  /**
   * @param {import('tinymce').Editor} editor
   */
  constructor (editor) {
    this.editor = editor
  }

  /** Register all plugin options (call during plugin init / PreInit). */
  register () {
    const { register } = this.editor.options
    register('mergetags_list', { processor: 'array', default: [] })
    register('mergetags_prefix', { processor: 'string', default: '{{' })
    register('mergetags_suffix', { processor: 'string', default: '}}' })
    register('mergetags_token_class', { processor: 'string', default: 'mce-mergetag' })
    register('mergetags_brace_class', { processor: 'string', default: 'mce-mergetag-affix' })
    register('mergetags_highlight_class', { processor: 'string', default: 'mt-active' })
    register('mergetags_show_braces', { processor: 'boolean', default: true })
    register('mergetags_highlight_on_insert', { processor: 'boolean', default: true })
    register('mergetags_display', { processor: 'string', default: 'value' })
    register('mergetags_keep_unknown', { processor: 'boolean', default: true })
  }

  /** @returns {string} */ getPrefix () { return this.editor.options.get('mergetags_prefix') }
  /** @returns {string} */ getSuffix () { return this.editor.options.get('mergetags_suffix') }
  /** @returns {string} */ getTokenClass () { return this.editor.options.get('mergetags_token_class') }
  /** @returns {string} */ getBraceClass () { return this.editor.options.get('mergetags_brace_class') }
  /** @returns {string} */ getActiveClass () { return this.editor.options.get('mergetags_highlight_class') }
  /** @returns {string} */ getDisplayMode () { return this.editor.options.get('mergetags_display') }
  /** @returns {boolean} */ highlightOnInsert () { return !!this.editor.options.get('mergetags_highlight_on_insert') }
  /** @returns {boolean} */ keepUnknown () { return !!this.editor.options.get('mergetags_keep_unknown') }
  /** @returns {Array} */ getList () { return this.editor.options.get('mergetags_list') }
}
