export const bindEvents = (editor, get, state, core) => {
  editor.on('PreInit', state.refreshFromOptions)

  editor.on('GetContent', (e) => {
    e.content = core.replaceTokensWithDelimiters(e.content)
  })
  const convertToTokensIfString = (event) => {
    event.content = core.replaceDelimitersWithTokens(event.content)
  }
  editor.on('BeforeSetContent', convertToTokensIfString)
  editor.on('PastePreProcess', convertToTokensIfString)

  editor.on('keydown', (event) => {
    const selectionNode = editor.selection?.getNode()
    const tokenElement = core.getTokenAncestor(selectionNode)
    if (!tokenElement) return
    event.preventDefault()
    editor.undoManager.transact(() => tokenElement.remove())
  })

  editor.on('NodeChange', (event) => {
    const tokenElement = core.getTokenAncestor(event.element)
    editor.selection.select(tokenElement)
    editor.selection.collapse(false)
  })

  let bodyClickHandler = null
  editor.on('init', () => {
    const bodyElement = editor.getBody()
    bodyClickHandler = (event) => core.onBodyClick(event)
    bodyElement.addEventListener('click', bodyClickHandler)
    setTimeout(core.transformInitialContentOnce, 0)
  })

  editor.on('LoadContent', core.transformInitialContentOnce)

  editor.on('remove', () => {
    const bodyElement = editor.getBody()
    bodyElement.removeEventListener('click', bodyClickHandler)
  })

  editor.on('PreInit', () => {
    editor.schema.addValidElements('span[class|contenteditable|data-mt-val|data-mt-uid]')
    const tokenClass = get.getTokenClass()
    const activeClass = get.getActiveClass()
    const braceClass = get.getBraceClass()
    editor.contentStyles.push(
      `.${tokenClass} .${braceClass}{color:#16a34a;font-weight:400;}`, // green braces
      `.${tokenClass}.${activeClass}{outline:3px solid rgba(0,125,126,.75);}`
    )
  })
}

export const registerCommands = (editor, state, core) => {
  editor.addCommand('mergetags:insert', (ui, data) => {
    const valueToInsert = data && (data.value || data)
    const tag = state.map.get(String(valueToInsert))
    core.insertTag(tag)
  })

  editor.addCommand('mergetags:setTokens', (ui, data) => {
    state.setTokens(data)
    const html = editor.getContent({ format: 'html' })
    const replaced = core.replaceDelimitersWithTokens(html)
    editor.setContent(replaced)
    core.migrateOldTokens()
  })
}
