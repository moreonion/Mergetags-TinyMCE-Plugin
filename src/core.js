import { escapeForRegex, attrEscape } from './utils/escape.js'
import State from './state.js' // internal dependency; not exposed outside

/**
 * Owns: state, DOM/content transforms, styles/schema.
 * Consumers (UI/Events/Commands) talk to Core instead of reaching into options/state directly.
 */
export default class Core {
  /**
   * @param {import('tinymce').Editor} editor
   * @param {import('../settings/OptionsManager.js').OptionsManager} options
   */
  constructor (editor, options) {
    this.editor = editor
    this.options = options
    this.state = new State(options) // state is private to Core

    // Ensure tokens & styles are ready on first load (no click required)
    // Populate tokens immediately (in case PreInit already fired)
    this.state.refreshFromOptions()

    // Hook TinyMCE lifecycle to install schema/styles + first transform
    this.editor.on('PreInit', () => {
      this.state.refreshFromOptions()
      this.installSchemaAndStyles()
    })

    this.editor.on('init', () => {
      // Next tick—after TinyMCE places initial HTML into the iframe
      setTimeout(this.transformInitialContentOnce, 0)
    })

    // If content is set/loaded later, also transform
    this.editor.on('LoadContent', this.transformInitialContentOnce)
  }

  /** Register schema + styles during PreInit. */
  installSchemaAndStyles = () => {
    this.editor.schema.addValidElements('span[class|contenteditable|data-mt-val|data-mt-uid]')
    const tokenClass = this.options.getTokenClass()
    const braceClass = this.options.getBraceClass()
    const activeClass = this.options.getActiveClass()
    this.editor.contentStyles.push(
      `.${tokenClass} .${braceClass}{color:#16a34a;font-weight:400;}`,
      `.${tokenClass}.${activeClass}{outline:3px solid rgba(0,125,126,.75);}`
    )
  }

  /** Load tokens from TinyMCE options into state (call on PreInit). */
  refreshTokensFromOptions = () => { this.state.refreshFromOptions() }

  /** Replace editor content with tokenized version after token set changes. */
  retokenizeEditorContent = () => {
    const html = this.editor.getContent({ format: 'html' })
    const replaced = this.replaceDelimitersWithTokens(html)
    this.editor.setContent(replaced)
    this.migrateOldTokens()
  }

  /** Return menu items built from current groups. */
  getMenuItems = () => this.#buildMenuItems(this.state.groupedTokens)

  /** Insert tag by raw value (public convenience). */
  insertByValue = (value) => {
    const tag = this.state.valueMap.get(String(value))
    this.insertTag(tag)
  }

  /**
   * Update token set at runtime.
   * @param {Array} data
   */
  setTokens = (data) => { this.state.setTokens(data) }

  /**
   * Autocomplete — returns [{ text, value }] for UI autocompleter.
   * @param {string} pattern
   * @param {number} [maxResults]
   */
  autocomplete = (pattern, maxResults) => {
    const q = (pattern || '').toLowerCase()
    const list = this.state.flatTokens
    const filtered = q
      ? list.filter(t => (t.title || t.value).toLowerCase().includes(q) || t.value.toLowerCase().includes(q))
      : list.slice()
    const cap = Math.min(
      typeof maxResults === 'number' ? maxResults : this.options.getMaxSuggestions(),
      filtered.length
    )
    return filtered.slice(0, cap).map(t => ({ text: t.title || t.value, value: t.value }))
  }

  /**
   * For tests and rare cases where callers need lists without state internals.
   */
  getTagValues = () => Array.from(this.state.valueMap.keys())

  // ───────────────────────────────────────────────────────────────────────────────
  // Content/DOM transforms
  // ───────────────────────────────────────────────────────────────────────────────

  #displayText (tag) { return this.options.getDisplayMode() === 'value' ? tag.value : (tag.title || tag.value) }

  createTokenElement (tag, uid) {
    const doc = this.editor.getDoc()
    const el = doc.createElement('span')
    el.setAttribute('class', this.options.getTokenClass())
    el.setAttribute('data-mt-val', tag.value)
    el.setAttribute('data-mt-uid', String(uid))
    el.setAttribute('contenteditable', 'false')

    const prefix = doc.createElement('span')
    prefix.setAttribute('class', this.options.getBraceClass())
    prefix.textContent = this.options.getPrefix()

    const textNode = doc.createTextNode(this.#displayText(tag))

    const suffix = doc.createElement('span')
    suffix.setAttribute('class', this.options.getBraceClass())
    suffix.textContent = this.options.getSuffix()

    el.append(prefix, textNode, suffix)

    return el
  }

  toSpanHTML (tag, uid) {
    const tokenClass = this.options.getTokenClass()
    const braceClass = this.options.getBraceClass()
    const escapedValue = attrEscape(tag.value)
    const uidAttr = uid ? ` data-mt-uid="${String(uid)}"` : ''

    return `<span class="${tokenClass}" data-mt-val="${escapedValue}"${uidAttr} contenteditable="false">` +
             `<span class="${braceClass}">${this.editor.dom.encode(this.options.getPrefix())}</span>` +
             `${this.editor.dom.encode(this.#displayText(tag))}` +
             `<span class="${braceClass}">${this.editor.dom.encode(this.options.getSuffix())}</span>` +
             '</span>'
  }

  clearActiveTokens () {
    const body = this.editor.getBody()
    const tokenClass = this.options.getTokenClass()
    const active = this.options.getActiveClass()
    body.querySelectorAll(`span.${tokenClass}.${active}`).forEach((n) => n.classList.remove(active))
  }

  activateToken (tokenEl) {
    this.clearActiveTokens()
    tokenEl.classList.add(this.options.getActiveClass())
    this.editor.selection.select(tokenEl)
    this.editor.selection.collapse(false)
  }

  insertTag = (tag) => {
    this.editor.undoManager.transact(() => {
      const uid = this.state.nextUid()
      const el = this.createTokenElement(tag, uid)
      this.editor.selection.setNode(el)
      if (this.options.highlightOnInsert()) this.activateToken(el)
    })
  }

  #buildMenuItems (items) {
    if (!Array.isArray(items) || !items.length) return [{ type: 'menuitem', text: 'No tags', enabled: false }]
    return items.map((item) => Array.isArray(item.menu)
      ? { type: 'nestedmenuitem', text: item.title || '', getSubmenuItems: () => this.#buildMenuItems(item.menu) }
      : { type: 'menuitem', text: item.title || item.value, onAction: () => this.insertTag({ title: item.title || item.value, value: item.value }) }
    )
  }

  /**
 * Convert token `<span>` markup back to delimited text (`{{ value }}`).
 * @param {string} html
 * @returns {string}
 */

  replaceTokensWithDelimiters (html) {
    const doc = document.implementation.createHTMLDocument('')
    const container = doc.createElement('div')
    container.innerHTML = html
    const tokenClass = this.options.getTokenClass()
    const pre = this.options.getPrefix()
    const suf = this.options.getSuffix()
    container.querySelectorAll(`span.${tokenClass}[data-mt-val]`).forEach((node) => {
      const v = node.getAttribute('data-mt-val') || ''
      node.replaceWith(doc.createTextNode(pre + v + suf))
    })
    return container.innerHTML
  }

  /**
 * Convert delimited text (`{{ value }}`) to token `<span>` markup where possible.
 * Unknown tags are preserved as-is when `keepUnknown` is true.
 * @param {string} html
 * @returns {string}
 */

  replaceDelimitersWithTokens (html) {
    const pre = this.options.getPrefix()
    const suf = this.options.getSuffix()
    // IMPORTANT: double-escape \\s and \\S when building a RegExp from a string
    const re = new RegExp(`${escapeForRegex(pre)}([\\s\\S]*?)${escapeForRegex(suf)}`, 'g')
    return html.replace(re, (match, inner) => {
      const tag = this.state.valueMap.get(String(inner))
      return tag ? this.toSpanHTML(tag) : match
    })
  }

  upgradeRawUnderCaret = () => {
    const rng = this.editor.selection?.getRng()
    const start = rng?.startContainer

    const textNode = start?.nodeType === Node.TEXT_NODE
      ? start
      : [...(start?.childNodes ?? [])].find(n => n.nodeType === Node.TEXT_NODE)

    if (!textNode) return false

    const pre = this.options.getPrefix()
    const suf = this.options.getSuffix()
    const re = new RegExp(`${escapeForRegex(pre)}([\\s\\S]*?)${escapeForRegex(suf)}`)
    const full = textNode.nodeValue
    const match = re.exec(full)
    if (!match) return false

    const inner = String(match[1])
    const tag = this.state.valueMap.get(inner)
    if (!tag) return false

    this.editor.undoManager.transact(() => {
      const before = full.slice(0, match.index)
      const after = full.slice(match.index + match[0].length)
      const parent = textNode.parentNode
      const uid = this.state.nextUid()
      const tokenEl = this.createTokenElement(tag, uid)
      if (before) parent.insertBefore(this.editor.getDoc().createTextNode(before), textNode)
      parent.insertBefore(tokenEl, textNode)
      if (after) parent.insertBefore(this.editor.getDoc().createTextNode(after), textNode)
      parent.removeChild(textNode)
      this.activateToken(tokenEl)
    })
    return true
  }

  migrateOldTokens = () => {
    const body = this.editor.getBody()
    if (!body) return
    const tokenClass = this.options.getTokenClass()
    const braceClass = this.options.getBraceClass()
    body.querySelectorAll(`span.${tokenClass}[data-mt-val]`).forEach((node) => {
      if (node.querySelector(`span.${braceClass}`)) return
      const v = node.getAttribute('data-mt-val') || ''
      const tag = this.state.valueMap.get(v) || { title: v, value: v }
      const uid = this.state.nextUid()
      const upgraded = this.createTokenElement(tag, uid)
      node.replaceWith(upgraded)
    })
  }

  transformInitialContentOnce = () => {
    if (this.state.didInitPass) return
    this.state.didInitPass = true
    const html = this.editor.getContent({ format: 'html' })
    const replaced = this.replaceDelimitersWithTokens(html)
    if (replaced !== html) this.editor.setContent(replaced)
    this.migrateOldTokens()
  }

  getTokenAncestor (node) {
    const tokenClass = this.options.getTokenClass()
    return this.editor.dom.getParent(node, (cand) => cand && cand.nodeType === 1 && this.editor.dom.hasClass(cand, tokenClass))
  }

  /**
 * Handle body clicks to activate tokens, or upgrade raw `{{ … }}` under caret.
 * @param {MouseEvent} event
 * @returns {void}
 */

  onBodyClick = (event) => {
    const tokenClass = this.options.getTokenClass()
    const tokenEl = this.editor.dom.getParent(event.target, (cand) => cand && cand.nodeType === 1 && this.editor.dom.hasClass(cand, tokenClass))
    if (tokenEl) {
      event.preventDefault()
      this.activateToken(tokenEl)
      return
    }
    if (this.upgradeRawUnderCaret()) return
    this.clearActiveTokens()
  }
}
