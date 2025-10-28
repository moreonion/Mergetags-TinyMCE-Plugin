// ContentTransformer - Handles conversion between delimited text and token spans.
// Owns: HTML content transformation, delimiter, token conversion
export default class ContentTransformer {
  constructor (editor, options, renderer, tokens) {
    this.editor = editor
    this.tokenClass = options.getTokenClass()
    this.renderer = renderer
    this.tokens = tokens
    }

  // Convert token `<span>` markup back to delimited text (`{{ value }}`) @param {string} htmlContent @returns {string}
  replaceTokensWithDelimiters (htmlContent) {
    const container = document.createElement('div')
    container.innerHTML = htmlContent
    container.querySelectorAll(`span.${this.tokenClass}[data-mt-val]`).forEach((tokenElement) => {
      const tokenValue = tokenElement.getAttribute('data-mt-val') || ''
      tokenElement.replaceWith(document.createTextNode(this.renderer.wrap(tokenValue)))
    })
    return container.innerHTML
  }

  // Convert delimited text (`{{ value }}`) to token `<span>` markup where possible
  replaceDelimitersWithTokens (htmlContent) {
    const delimiterRegex = this.renderer.getDelimiterRegex('g')
    return htmlContent.replace(delimiterRegex, (match, rawValue) => {
      const token = this.tokens.getByValue(String(rawValue))
      return token ? this.renderer.toSpanHTML(token) : match
    })
  }
}
