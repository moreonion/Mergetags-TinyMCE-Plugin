// ContentTransformer - Handles conversion between delimited text and token spans.
// Owns: HTML content transformation, delimiter, token conversion
export default class ContentTransformer {
  constructor (editor, options, renderer, tokens, format) {
    this.editor = editor
    this.options = options
    this.renderer = renderer
    this.tokens = tokens
    this.format = format
  }

  // Convert token `<span>` markup back to delimited text (`{{ value }}`) @param {string} htmlContent @returns {string}
  replaceTokensWithDelimiters (htmlContent) {
    const editorDoc = this.editor.getDoc()
    const container = editorDoc.createElement('div')
    container.innerHTML = htmlContent
    container.querySelectorAll(`span.${this.options.getTokenClass()}[data-mt-val]`).forEach((tokenElement) => {
      const tokenValue = tokenElement.getAttribute('data-mt-val') || ''
      tokenElement.replaceWith(editorDoc.createTextNode(this.format.wrap(tokenValue)))
    })
    return container.innerHTML
  }

  // Convert delimited text (`{{ value }}`) to token `<span>` markup where possible
  replaceDelimitersWithTokens (htmlContent) {
    const delimiterRegex = this.format.getDelimiterRegex('g')
    return htmlContent.replace(delimiterRegex, (match, rawValue) => {
      const token = this.tokens.getByValue(String(rawValue))
      return token ? this.renderer.toSpanHTML(token) : match
    })
  }
}
