// ContentTransformer - Handles conversion between delimited text and token spans.
// Owns: HTML content transformation, delimiter, token conversion
export default class ContentTransformer {
  constructor (options, renderer, tokens) {
    this.tokenClass = options.getTokenClass()
    this.renderer = renderer
    this.getByValue = tokens.getByValue.bind(tokens)
  }

  replaceTokensWithDelimiters (html) {
    const container = document.createElement('div')
    container.innerHTML = html
    for (const el of container.querySelectorAll(`span.${this.tokenClass}[data-mt-val]`)) {
      const val = el.getAttribute('data-mt-val') || ''
      el.replaceWith(document.createTextNode(this.renderer.wrap(val)))
    }
    return container.innerHTML
  }

  replaceDelimitersWithTokens (html) {
    const re = this.renderer.getDelimiterRegex('g')
    return html.replace(re, (match, rawValue) => {
      const token = this.getByValue(String(rawValue))
      return token ? this.renderer.toSpanHTML(token) : match
    })
  }
}
