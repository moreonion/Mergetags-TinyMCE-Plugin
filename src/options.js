export default class Options {
  constructor (editor) {
    this.editor = editor
  }

  // Register all plugin options
  register () {
    const { register } = this.editor.options
    register('mergetags_prefix', { processor: 'string', default: '{{' })
    register('mergetags_suffix', { processor: 'string', default: '}}' })
    register('mergetags_token_class', { processor: 'string', default: 'mce-mergetag' })
    register('mergetags_brace_class', { processor: 'string', default: 'mce-mergetag-affix' })
    register('mergetags_highlight_class', { processor: 'string', default: 'mt-active' })
    register('mergetags_display', { processor: 'string', default: 'value' })
    register('mergetags_keep_unknown', { processor: 'boolean', default: true })
    register('mergetags_list', { processor: 'array', default: [] })
  }

  getPrefix () { return this.editor.options.get('mergetags_prefix') }
  getSuffix () { return this.editor.options.get('mergetags_suffix') }
  getTokenClass () { return this.editor.options.get('mergetags_token_class') }
  getBraceClass () { return this.editor.options.get('mergetags_brace_class') }
  getActiveClass () { return this.editor.options.get('mergetags_highlight_class') }
  getDisplayMode () { return this.editor.options.get('mergetags_display') }
  keepUnknown () { return !!this.editor.options.get('mergetags_keep_unknown') }
  getList () { return this.editor.options.get('mergetags_list') }
}
