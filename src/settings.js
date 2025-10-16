export const registerOptions = (editor) => {
  const register = editor.options.register
  register('mergetags_list', { processor: 'array', default: [] })
  register('mergetags_prefix', { processor: 'string', default: '{{' })
  register('mergetags_suffix', { processor: 'string', default: '}}' })
  register('mergetags_trigger', { processor: 'string', default: '{{' })
  register('mergetags_max_suggestions', { processor: 'number', default: 100 })
  register('mergetags_token_class', { processor: 'string', default: 'mce-mergetag' })
  register('mergetags_brace_class', { processor: 'string', default: 'mce-mergetag-affix' })
  register('mergetags_highlight_class', { processor: 'string', default: 'mt-active' })
  register('mergetags_show_braces', { processor: 'boolean', default: true })
  register('mergetags_highlight_on_insert', { processor: 'boolean', default: true })
  register('mergetags_display', { processor: 'string', default: 'value' })
  register('mergetags_keep_unknown', { processor: 'boolean', default: true })
}

export const getters = (editor) => ({
  getPrefix: () => editor.options.get('mergetags_prefix'),
  getSuffix: () => editor.options.get('mergetags_suffix'),
  getTrigger: () => editor.options.get('mergetags_trigger') || '{{',
  getMaxSuggestions: () => Number(editor.options.get('mergetags_max_suggestions')),
  getTokenClass: () => editor.options.get('mergetags_token_class'),
  getBraceClass: () => editor.options.get('mergetags_brace_class'),
  getActiveClass: () => editor.options.get('mergetags_highlight_class'),
  getDisplayMode: () => editor.options.get('mergetags_display'),
  showBraces: () => editor.options.get('mergetags_show_braces'),
})
