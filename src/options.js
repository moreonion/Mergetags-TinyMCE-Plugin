export default class Options {
  constructor (editorOptions) {
    this.editorOptions = editorOptions
  }

  // Register all plugin options
  register () {
    const { register } = this.editorOptions
    register('mergetags_prefix', { processor: 'string', default: '{{' })
    register('mergetags_suffix', { processor: 'string', default: '}}' })
    register('mergetags_token_class', { processor: 'string', default: 'mce-mergetag' })
    register('mergetags_brace_class', { processor: 'string', default: 'mce-mergetag-affix' })
    register('mergetags_highlight_class', { processor: 'string', default: 'mt-active' })
    register('mergetags_display', { processor: 'string', default: 'value' })
    register('mergetags_keep_unknown', { processor: 'boolean', default: true })
    register('mergetags_list', { processor: 'array', default: [] })
  }

  getPrefix () { return this.editorOptions.get('mergetags_prefix') }
  getSuffix () { return this.editorOptions.get('mergetags_suffix') }
  getTokenClass () { return this.editorOptions.get('mergetags_token_class') }
  getBraceClass () { return this.editorOptions.get('mergetags_brace_class') }
  getActiveClass () { return this.editorOptions.get('mergetags_highlight_class') }
  getDisplayMode () { return this.editorOptions.get('mergetags_display') }
  keepUnknown () { return !!this.editorOptions.get('mergetags_keep_unknown') }
  getList () { return this.editorOptions.get('mergetags_list') }
}
