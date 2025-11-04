// TokenRenderer - Responsible for creating and rendering token DOM elements
// token HTML/element creation, display text logic
import { escapeForRegex } from '../utils/escape.js'

export default class TokenRenderer {
  constructor (options) {
    this.displayMode = options.getDisplayMode()
    this.tokenClass = options.getTokenClass()
    this.braceClass = options.getBraceClass()
    this.prefix = options.getPrefix()
    this.suffix = options.getSuffix()
  }

  // Get display text based on current display mode
  #getDisplayText (tag) {
    return this.displayMode === 'value'
      ? tag.value
      : (tag.title || tag.value)
  }

  // Create a token DOM element
  createTokenElement (tag) {
    const el = document.createElement('span')
    el.setAttribute('class', this.tokenClass)
    el.setAttribute('data-mt-val', tag.value)
    el.setAttribute('contenteditable', 'false')

    const prefix = document.createElement('span')
    prefix.setAttribute('class', this.braceClass)
    prefix.textContent = this.prefix

    const textNode = document.createTextNode(this.#getDisplayText(tag))

    const suffix = document.createElement('span')
    suffix.setAttribute('class', this.braceClass)
    suffix.textContent = this.suffix

    el.append(prefix, textNode, suffix)

    return el
  }

  // Create token HTML string
  toSpanHTML (tag, uid) {
    return this.createTokenElement(tag, uid).outerHTML
  }

  // Build a regex that matches {{ any-content }} between current prefix/suffix
  getDelimiterRegex (flags = 'g') {
    const prefix = escapeForRegex(this.prefix)
    const suffix = escapeForRegex(this.suffix)
    return new RegExp(`${prefix}([\\s\\S]*?)${suffix}`, flags)
  }

  // Wrap a raw value with delimiters, e.g. -> {{ value }}
  wrap (value) {
    return `${this.prefix}${String(value)}${this.suffix}`
  }

  replaceTokensWithDelimiters (html) {
    const container = document.createElement('div')
    container.innerHTML = html
    for (const el of container.querySelectorAll(`span.${this.tokenClass}[data-mt-val]`)) {
      const val = el.getAttribute('data-mt-val') || ''
      el.replaceWith(document.createTextNode(this.wrap(val)))
    }
    return container.innerHTML
  }

  replaceDelimitersWithTokens (html, tokens) {
    const re = this.getDelimiterRegex('g')
    return html.replace(re, (match, rawValue) => {
      const token = tokens.getByValue(String(rawValue))
      return token ? this.toSpanHTML(token) : match
    })
  }
}
