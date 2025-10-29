import { describe, test, assert, beforeEach } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import Core from '../core.js'

let editor, options, core
beforeEach(() => {
  editor = createEditorStub()
  options = new Options(editor)
  options.register()
  core = new Core(editor, options)
  core.setTokens([{ title: 'User', menu: [{ title: 'First Name', value: 'first_name' }, { title: 'Last', value: 'last_name' }] }])
})

describe('Core transforms', () => {
  test('replaceDelimitersWithTokens / replaceTokensWithDelimiters round-trip', () => {
    const html = `<p>Hello ${options.getPrefix()}first_name${options.getSuffix()}</p>`
    const upgraded = core.replaceDelimitersWithTokens(html)
    assert.match(upgraded, /<span[^>]+data-mt-val="first_name"/)

    const back = core.replaceTokensWithDelimiters(upgraded)
    assert.strictEqual(back, '<p>Hello {{first_name}}</p>')
  })
})

describe('Core insertion and click activation', () => {
  test('insertByValue inserts a token into the body', () => {
    const before = editor.getBody().innerHTML.length
    core.insertByValue('first_name')
    const after = editor.getBody().innerHTML.length
    assert.isAtLeast(after, before)
    assert.ok(editor.getBody().querySelector('[data-mt-val="first_name"]'))
  })

  test('onContainerClick activates tokens', () => {
    editor.setContent(core.replaceDelimitersWithTokens(`${options.getPrefix()}first_name${options.getSuffix()}`))
    const token = editor.getBody().querySelector('[data-mt-val="first_name"]')
    const ev = { target: token, preventDefault: () => {} }
    core.onContainerClick(ev)
    assert.isTrue(token.classList.contains(options.getActiveClass()))
  })
})
