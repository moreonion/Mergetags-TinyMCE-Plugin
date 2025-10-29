import { describe, it, expect } from 'vitest'
import TokenRenderer from '../tokens/tokenRenderer.js'
import Options from '../options.js'
import { createEditorStub } from './helpers/editorStub.js'

const setup = (over = {}) => {
  const editor = createEditorStub()
  const options = new Options(editor)
  options.register()
  if (over.prefix) editor.options.set('mergetags_prefix', over.prefix)
  if (over.suffix) editor.options.set('mergetags_suffix', over.suffix)
  if (over.displayMode) editor.options.set('mergetags_display', over.displayMode)
  return { editor: editor, options: options, renderer: new TokenRenderer(options) }
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
})
