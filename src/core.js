const escapeForRegex = (sourceString) => String(sourceString).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const attrEscape = (attributeString) =>
  String(attributeString).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const makeCore = (editor, get, state) => {
  const displayText = (tag) =>
    get.getDisplayMode() === 'value' ? tag.value : (tag.title || tag.value)

  const createTokenElement = (tag, uid) => {
    const documentRef = editor.getDoc()
    const tokenElement = documentRef.createElement('span')
    tokenElement.setAttribute('class', get.getTokenClass())
    tokenElement.setAttribute('data-mt-val', tag.value)
    if (uid) tokenElement.setAttribute('data-mt-uid', String(uid))
    tokenElement.setAttribute('contenteditable', 'false')

    if (get.showBraces()) {
      const prefixSpan = documentRef.createElement('span')
      prefixSpan.setAttribute('class', get.getBraceClass())
      prefixSpan.textContent = get.getPrefix()

      const textNode = documentRef.createTextNode(displayText(tag))

      const suffixSpan = documentRef.createElement('span')
      suffixSpan.setAttribute('class', get.getBraceClass())
      suffixSpan.textContent = get.getSuffix()

      tokenElement.append(prefixSpan, textNode, suffixSpan)
    }
    else {
      tokenElement.textContent = displayText(tag)
    }
    return tokenElement
  }

  const toSpanHTML = (tag, uid) => {
    const tokenClass = get.getTokenClass()
    const braceClass = get.getBraceClass()
    const escapedValue = attrEscape(tag.value)
    const uidAttribute = uid ? ` data-mt-uid="${String(uid)}"` : ''
    if (get.showBraces()) {
      return `<span class="${tokenClass}" data-mt-val="${escapedValue}"${uidAttribute} contenteditable="false">` +
             `<span class="${braceClass}">${editor.dom.encode(get.getPrefix())}</span>` +
             `${editor.dom.encode(displayText(tag))}` +
             `<span class="${braceClass}">${editor.dom.encode(get.getSuffix())}</span>` +
             '</span>'
    }
    return `<span class="${tokenClass}" data-mt-val="${escapedValue}"${uidAttribute} contenteditable="false">${editor.dom.encode(displayText(tag))}</span>`
  }

  const clearActiveTokens = () => {
    const bodyElement = editor.getBody()
    const tokenClass = get.getTokenClass()
    const activeClass = get.getActiveClass()
    bodyElement.querySelectorAll(`span.${tokenClass}.${activeClass}`).forEach((node) => node.classList.remove(activeClass))
  }

  const activateToken = (tokenElement) => {
    clearActiveTokens()
    tokenElement.classList.add(get.getActiveClass())
    editor.selection.select(tokenElement)
    editor.selection.collapse(false)
  }

  const insertTag = (tag) => {
    editor.undoManager.transact(() => {
      const uid = state.nextUid()
      const element = createTokenElement(tag, uid)
      editor.selection.setNode(element)
    })
  }

  const buildMenuItems = (items) => {
    if (!Array.isArray(items) || !items.length) {
      return [{ type: 'menuitem', text: 'No tags', enabled: false }]
    }
    return items.map((item) => {
      if (Array.isArray(item.menu)) {
        return {
          type: 'nestedmenuitem',
          text: item.title || '',
          getSubmenuItems: () => buildMenuItems(item.menu),
        }
      }
      return {
        type: 'menuitem',
        text: item.title || item.value,
        onAction: () => insertTag({ title: item.title || item.value, value: item.value }),
      }
    })
  }

  const replaceTokensWithDelimiters = (html) => {
    const workingDocument = document.implementation.createHTMLDocument('')
    const containerElement = workingDocument.createElement('div')
    containerElement.innerHTML = html
    const tokenClass = get.getTokenClass()
    const prefixText = get.getPrefix()
    const suffixText = get.getSuffix()
    containerElement.querySelectorAll(`span.${tokenClass}[data-mt-val]`).forEach((node) => {
      const valueAttr = node.getAttribute('data-mt-val') || ''
      node.replaceWith(workingDocument.createTextNode(prefixText + valueAttr + suffixText))
    })
    return containerElement.innerHTML
  }

  const replaceDelimitersWithTokens = (html) => {
    const prefixText = get.getPrefix()
    const suffixText = get.getSuffix()
    const genericPattern = new RegExp(`${escapeForRegex(prefixText)}([\\s\\S]*?)${escapeForRegex(suffixText)}`, 'g')
    return html.replace(genericPattern, (match, valueInsideDelimiters) => {
      const tag = state.map.get(String(valueInsideDelimiters))
      return tag ? toSpanHTML(tag) : match
    })
  }

  const upgradeRawUnderCaret = () => {
    const selectionRange = editor.selection?.getRng()
    const start = selectionRange.startContainer

    const textNode =
      start?.nodeType === Node.TEXT_NODE
        ? start
        : [...(start?.childNodes ?? [])].find(n => n.nodeType === Node.TEXT_NODE)

    if (!textNode) return false

    const prefixText = get.getPrefix()
    const suffixText = get.getSuffix()
    const delimiterRegex = new RegExp(`${escapeForRegex(prefixText)}([\\s\\S]*?)${escapeForRegex(suffixText)}`)
    const fullText = textNode.nodeValue
    const match = delimiterRegex.exec(fullText)
    if (!match) return false

    const valueInsideDelimiters = String(match[1])
    const tag = state.map.get(valueInsideDelimiters)
    if (!tag) return false

    editor.undoManager.transact(() => {
      const textBefore = fullText.slice(0, match.index)
      const textAfter = fullText.slice(match.index + match[0].length)
      const parentNode = textNode.parentNode
      const uid = state.nextUid()
      const tokenElement = createTokenElement(tag, uid)
      if (textBefore) parentNode.insertBefore(editor.getDoc().createTextNode(textBefore), textNode)
      parentNode.insertBefore(tokenElement, textNode)
      if (textAfter) parentNode.insertBefore(editor.getDoc().createTextNode(textAfter), textNode)
      parentNode.removeChild(textNode)
      activateToken(tokenElement)
    })
    return true
  }

  const migrateOldTokens = () => {
    const bodyElement = editor.getBody()
    if (!bodyElement) return
    const tokenClass = get.getTokenClass()
    const braceClass = get.getBraceClass()
    bodyElement.querySelectorAll(`span.${tokenClass}[data-mt-val]`).forEach((node) => {
      if (node.querySelector(`span.${braceClass}`)) return
      const valueAttr = node.getAttribute('data-mt-val') || ''
      const tag = state.map.get(valueAttr) || { title: valueAttr, value: valueAttr }
      const uid = state.nextUid()
      const newTokenElement = createTokenElement(tag, uid)
      node.replaceWith(newTokenElement)
    })
  }

  const transformInitialContentOnce = () => {
    if (state.didInitPass) return
    state.didInitPass = true
    const html = editor.getContent({ format: 'html' })
    const replaced = replaceDelimitersWithTokens(html)
    if (replaced !== html) editor.setContent(replaced)
    migrateOldTokens()
  }

  const getTokenAncestor = (node) => {
    const tokenClass = get.getTokenClass()
    return editor.dom.getParent(node, (candidate) => candidate && candidate.nodeType === 1 && editor.dom.hasClass(candidate, tokenClass))
  }

  const onBodyClick = (event) => {
    const tokenClass = get.getTokenClass()
    const tokenElement = editor.dom.getParent(event.target, (candidate) => candidate && candidate.nodeType === 1 && editor.dom.hasClass(candidate, tokenClass))
    if (tokenElement) {
      event.preventDefault()
      activateToken(tokenElement)
      return
    }
    if (upgradeRawUnderCaret()) return
    clearActiveTokens()
  }

  return {
    createTokenElement,
    toSpanHTML,
    insertTag,
    buildMenuItems,
    replaceTokensWithDelimiters,
    replaceDelimitersWithTokens,
    upgradeRawUnderCaret,
    migrateOldTokens,
    transformInitialContentOnce,
    clearActiveTokens,
    activateToken,
    getTokenAncestor,
    onBodyClick,
  }
}
