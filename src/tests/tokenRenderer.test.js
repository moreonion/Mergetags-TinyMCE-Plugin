import { describe, it, expect } from 'vitest'
import TokenRenderer from '../tokens/tokenRenderer.js'
import Options from '../options.js'
import TokenStore from '../tokens/tokenStore.js'
import { createEditorStub } from './helpers/editorStub.js'

const setup = (over = {}) => {
  const editor = createEditorStub()
  const options = new Options(editor.options)
  options.register()
  if (over.prefix) editor.options.set('mergetags_prefix', over.prefix)
  if (over.suffix) editor.options.set('mergetags_suffix', over.suffix)
  if (over.displayMode) editor.options.set('mergetags_display', over.displayMode)
  return { editor: editor, options: options, renderer: new TokenRenderer(options) }
}

const render = (renderer, html, tokensList) => {
  const tokens = new TokenStore()
  tokens.setTokens(tokensList)
  const out = renderer.replaceDelimitersWithTokens(html, tokens)
  const container = document.createElement('div')
  container.innerHTML = out
  return container
}

const expectToken = (root, options, value) => {
  expect(root.querySelector(`span.${options.getTokenClass()}[data-mt-val="${value}"]`)).toBeTruthy()
}

describe('TokenRenderer', () => {
  it('creates proper span HTML with classes and data attributes', () => {
    const { renderer, options } = setup({ displayMode: 'title' })
    const html = renderer.toSpanHTML({ title: 'First Name', value: 'first' })
    expect(html).toMatch(new RegExp(`<span[^>]+class="${options.getTokenClass()}"`))
    expect(html).toMatch(/data-mt-val="first"/)
    expect(html).toBe(`<span class="${options.getTokenClass()}" data-mt-val="first" contenteditable="false"><span class="${options.getBraceClass()}">${options.getPrefix()}</span>First Name<span class="${options.getBraceClass()}">${options.getSuffix()}</span></span>`)
  })

  it('getDelimiterRegex matches with spaces and NBSP and is escaped', () => {
    const { renderer } = setup({ prefix: '[[', suffix: ']]' })
    const re = renderer.getDelimiterRegex('g')
    const input = 'Hello [[\u00A0abc\u00A0]] ok [[ xyz ]] nope'
    const matches = input.match(re) || []
    expect(matches.length).toBe(2)
  })

  it('wrap returns prefix + value + suffix', () => {
    const { renderer } = setup({ prefix: '{{', suffix: '}}' })
    expect(renderer.wrap('x')).toBe('{{x}}')
  })

  it('renders delimiters in text nodes and keeps href attributes raw', () => {
    const { renderer, options } = setup()
    const html = '<a title="title" href="{{url.comfirmation}}">{{url.comfirmation}}</a>'
    const root = render(renderer, html, [{ title: 'URL', menu: [{ title: 'Confirmation', value: 'url.comfirmation' }] }])
    const link = root.querySelector('a')

    expect(link?.getAttribute('href')).toBe('{{url.comfirmation}}')
    expectToken(link, options, 'url.comfirmation')
  })

  it('keeps unquoted href attributes raw', () => {
    const { renderer, options } = setup()
    const root = render(renderer, '<a href={{url.toke}}>{{url.toke}}</a>', [{ title: 'URL', menu: [{ title: 'Token', value: 'url.toke' }] }])
    const link = root.querySelector('a')

    expect(link?.getAttribute('href')).toBe('{{url.toke}}')
    expectToken(link, options, 'url.toke')
  })

  it('keeps href delimiters unchanged for multiple links and quote styles', () => {
    const { renderer, options } = setup()
    const html = '<a href="{{id}}">{{id}}</a><a href=\'https://x.test/{{email}}\'>{{email}}</a>'
    const root = render(renderer, html, [{ title: 'Id', value: 'id' }, { title: 'Email', value: 'email' }])
    const links = root.querySelectorAll('a')

    expect(links[0].getAttribute('href')).toBe('{{id}}')
    expect(links[1].getAttribute('href')).toBe('https://x.test/{{email}}')
    expectToken(links[0], options, 'id')
    expectToken(links[1], options, 'email')
  })

  it('keeps unknown delimiters raw in href and text', () => {
    const { renderer } = setup()
    const root = render(renderer, '<a href="{{unknown}}">{{unknown}}</a>', [{ title: 'Known', value: 'known' }])
    const link = root.querySelector('a')

    expect(link?.getAttribute('href')).toBe('{{unknown}}')
    expect(link?.textContent).toBe('{{unknown}}')
  })

  it('does not re-tokenize delimiters already inside rendered token spans', () => {
    const { renderer, options } = setup({ displayMode: 'title' })
    const existing = renderer.toSpanHTML({ title: 'First Name', value: 'first_name' })
    const root = render(renderer, `<p>${existing} and {{first_name}}</p>`, [{ title: 'First Name', value: 'first_name' }])
    const tokenEls = root.querySelectorAll(`span.${options.getTokenClass()}[data-mt-val="first_name"]`)

    expect(tokenEls.length).toBe(2)
  })
})
