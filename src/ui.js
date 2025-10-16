export const registerUI = (editor, get, state, core) => {
  editor.ui.registry.addIcon('mergetags',
    '<svg width="24" height="24" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 5a2 2 0 0 1 1.6.8L21 12l-4.4 6.2a2 2 0 0 1-1.6.8h-3v-2h3l3.5-5L15 7H5v3H3V7c0-1.1.9-2 2-2h10Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 12a1 1 0 0 0-1 1v2H3a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2H7v-2c0-.6-.4-1-1-1Z"></path></svg>'
  )

  editor.ui.registry.addMenuButton('mergetags', {
    icon: 'mergetags',
    tooltip: 'Insert merge tag',
    fetch: (provideMenuItems) => provideMenuItems(core.buildMenuItems(state.grouped)),
  })

  editor.ui.registry.addAutocompleter('mergetags', {
    trigger: get.getTrigger(),
    minChars: 0,
    columns: 1,
    matches: () => true,
    fetch: (pattern, maxResults) => {
      const searchTerm = (pattern || '').toLowerCase()
      const filteredList = searchTerm
        ? state.flat.filter((token) => token.title.toLowerCase().includes(searchTerm) || token.value.toLowerCase().includes(searchTerm))
        : state.flat.slice()
      const maxSuggestionsOption = get.getMaxSuggestions()
      const resultCap = Math.min(maxResults || maxSuggestionsOption, maxSuggestionsOption)
      return Promise.resolve(filteredList.slice(0, resultCap).map((token) => ({ text: token.title, value: token.value })))
    },
    onAction: (api, selectionRange, value) => {
      editor.selection.setRng(selectionRange)
      const tag = state.map.get(String(value)) || { title: String(value), value: String(value) }
      core.insertTag(tag)
      api.hide()
    },
  })
}
