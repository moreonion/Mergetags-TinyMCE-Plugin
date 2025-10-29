import { describe, it, expect } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import TokenRenderer from '../tokens/TokenRenderer.js'
import ContentTransformer from '../tokens/contentTransformer.js'

describe('ContentTransformer', () => {
  it('replaces delimiters with tokens and back', () => {
    // Set up editor/options and override prefix/suffix BEFORE creating the renderer
    const editor = createEditorStub()
    const options = new Options(editor)
    options.register()
    editor.options.set('mergetags_prefix', '<<')
    editor.options.set('mergetags_suffix', '>>')

    // Renderer picks values from options now set to << >>
    const renderer = new TokenRenderer(options)

    // Minimal token lookup stub
    const token = { title: 'Email', value: 'user.email' }
    const tokens = { getByValue: (v) => (String(v) === token.value ? token : null) }

    const transformer = new ContentTransformer(options, renderer, tokens)

    const input = 'Hello, <<user.email>>!'

    const toTokens = transformer.replaceDelimitersWithTokens(input)
    // should have produced a token span
    expect(toTokens).toMatch(/<span[^>]+class="mce-mergetag"[^>]+data-mt-val="user\.email"/)

    const back = transformer.replaceTokensWithDelimiters(toTokens)
    // allow optional spaces or NBSP between value and delimiters
    expect(back).toMatch(/&lt;&lt;[\s\u00A0]*user\.email[\s\u00A0]*&gt;&gt;/)
  })
})
