import { attrEscape } from '../utils/escape.js'

/**
 * TokenRenderer - Responsible for creating and rendering token DOM elements.
 * Owns: token HTML/element creation, display text logic.
 */
export default class TokenRenderer {
  /**
   * @param {import('tinymce').Editor} editor
   * @param {import('../options.js').default} options
   * @param {import('./tokenFormat.js').default} format
   */
  constructor (editor, options, format) {
    this.editor = editor
    this.options = options
    this.format = format
  }

  /**
   * Get display text based on current display mode.
   * @param {{ title?: string, value: string }} tag
   * @returns {string}
   */
  #getDisplayText (tag) {
    return this.options.getDisplayMode() === 'value'
      ? tag.value
      : (tag.title || tag.value)
  }

  /**
   * Create a token DOM element.
   * @param {{ title?: string, value: string }} tag
   * @param {string} uid
   * @returns {HTMLSpanElement}
   */
  createTokenElement (tag, uid) {
    const doc = this.editor.getDoc()
    const el = doc.createElement('span')
    el.setAttribute('class', this.options.getTokenClass())
    el.setAttribute('data-mt-val', tag.value)
    el.setAttribute('contenteditable', 'false')

    const prefix = doc.createElement('span')
    prefix.setAttribute('class', this.options.getBraceClass())
    prefix.textContent = this.format.getPrefix()

    const textNode = doc.createTextNode(this.#getDisplayText(tag))

    const suffix = doc.createElement('span')
    suffix.setAttribute('class', this.options.getBraceClass())
    suffix.textContent = this.format.getSuffix()

    el.append(prefix, textNode, suffix)

    return el
  }

  /**
   * Create token HTML string.
   * @param {{ title?: string, value: string }} tag
   * @param {string} [uid]
   * @returns {string}
   */
  toSpanHTML (tag, uid) {
    const tokenClass = this.options.getTokenClass()
    const braceClass = this.options.getBraceClass()
    const escapedValue = attrEscape(tag.value)

    return `<span class="${tokenClass}" data-mt-val="${escapedValue}" contenteditable="false">` +
             `<span class="${braceClass}">${this.editor.dom.encode(this.format.getPrefix())}</span>` +
             `${this.editor.dom.encode(this.#getDisplayText(tag))}` +
             `<span class="${braceClass}">${this.editor.dom.encode(this.format.getSuffix())}</span>` +
             '</span>'
  }
}
