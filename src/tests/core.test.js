import { describe, test, assert, beforeEach, vi } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import Core from '../core.js'
import TokenStore from '../tokens/tokenStore.js'
import TokenRenderer from '../tokens/tokenRenderer.js'
import TokenInteractions from '../tokens/tokenInteractions.js'

let editor, options, tokens, renderer, interactions, core
beforeEach(() => {
  editor = createEditorStub()
  options = new Options(editor.options)
  options.register()
  tokens = new TokenStore()
  tokens.setTokens([{ title: 'User', menu: [{ title: 'First', value: 'first_name' }, { title: 'Last', value: 'last_name' }] }])
  renderer = new TokenRenderer(options)
  interactions = new TokenInteractions(editor, options, renderer, tokens)
  core = new Core(editor, options, tokens, renderer, interactions)
})

describe('Core transforms', () => {
  test('replaceDelimitersWithTokens / replaceTokensWithDelimiters round-trip', () => {
    const html = `<p>Hello ${options.getPrefix()}first_name${options.getSuffix()}</p>`
    const upgraded = core.renderer.replaceDelimitersWithTokens(html, tokens)
    assert.match(upgraded, /<span[^>]+data-mt-val="first_name"/)

    const back = core.renderer.replaceTokensWithDelimiters(upgraded)
    assert.strictEqual(back, '<p>Hello {{first_name}}</p>')
  })

  test('insertByValue inserts a token element', () => {
    editor.setContent('<p>start</p>')
    const before = editor.getBody().innerHTML.length
    core.interactions.insertByValue('first_name')
    const after = editor.getBody().innerHTML.length
    assert.isAtLeast(after, before)
    assert.ok(editor.getBody().querySelector('[data-mt-val="first_name"]'))
  })

  test('activateTokenOnClick activates tokens', () => {
    editor.setContent(core.renderer.replaceDelimitersWithTokens(`${options.getPrefix()}first_name${options.getSuffix()}`, tokens))
    const token = editor.getBody().querySelector('[data-mt-val="first_name"]')
    const ev = { target: token, preventDefault: () => {} }
    core.interactions.activateTokenOnClick(ev)
    assert.isTrue(token.classList.contains(options.getActiveClass()))
  })
})

describe('Core ui mount', () => {
  test('registers icon, menu button, nested menu and autocompleter', async () => {
    core.mount()
    // icon and menu button registered
    assert.ok(editor._icons.mergetags)
    assert.ok(editor._menuButtons.mergetags)
    assert.ok(typeof editor._autocompleters.mergetags === 'object')

    // autocompleter fetch + onAction
    const ac = editor._autocompleters.mergetags
    const items = await ac.fetch('', 10)
    assert.ok(Array.isArray(items))
    assert.isAtLeast(items.length, 1)

    const api = { hide: vi.fn() }
    const insertSpy = vi.spyOn(interactions, 'insertByValue')
    ac.onAction(api, null, 'first_name')
    assert.isTrue(insertSpy.mock.calls.length >= 1)
    assert.isTrue(api.hide.mock.calls.length >= 1)
  })
})
