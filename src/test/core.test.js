import { describe, test, assert, beforeEach } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import Core from '../core.js'

const setup = (optionOverrides = {}) => {
  const editor = createEditorStub()
  const options = new Options(editor)
  options.register()
  for (const [key, value] of Object.entries(optionOverrides)) editor.options.set(key, value)
  const core = new Core(editor, options)
  core.setTokens([{ title: 'User', menu: [{ title: 'First Name', value: 'first_name' }, { title: 'Last', value: 'last_name' }] }])
  return { editor, options, core }
}
// shared test context
let editor, options, core
const reinit = (overrides = {}) => ({ editor, options, core } = setup(overrides))

beforeEach(() => {
  reinit()
})

describe('createTokenElement & toSpanHTML', () => {
  test('renders token element with braces and attributes', () => {
    const el = core.createTokenElement({ title: 'First Name', value: 'first_name' }, 'abc')
    assert.strictEqual(el.getAttribute('class'), options.getTokenClass())
    assert.strictEqual(el.getAttribute('data-mt-val'), 'first_name')
    assert.strictEqual(el.getAttribute('data-mt-uid'), 'abc')
    assert.strictEqual(el.getAttribute('contenteditable'), 'false')
    const html = core.toSpanHTML({ title: 'First Name', value: 'first_name' }, 'abc')
    assert.match(html, new RegExp(`<span class="${options.getBraceClass()}">`))
  })
})

describe('replaceTokensWithDelimiters', () => {
  test('converts token spans to {{value}} text', () => {
    const tokenClass = options.getTokenClass()
    const braceClass = options.getBraceClass()
    const html = `<p>Hello <span class="${tokenClass}" data-mt-val="first_name" contenteditable="false">
      <span class="${braceClass}">{{</span>First Name<span class="${braceClass}">}}</span></span>!</p>`

    const out = core.replaceTokensWithDelimiters(html)
    assert.strictEqual(
      out.replace(/\s+/g, ''),
      `<p>Hello ${options.getPrefix()}first_name${options.getSuffix()}!</p>`.replace(/\s+/g, '')
    )
  })
})

describe('replaceDelimitersWithTokens', () => {
  test('converts {{value}} to token span using state map', () => {
    const out = core.replaceDelimitersWithTokens(
      `<p>Hi ${options.getPrefix()}first_name${options.getSuffix()}!</p>`
    )
    assert.match(out, /<span[^>]+data-mt-val="first_name"/)
  })

  test('leaves unknown values intact (keepUnknown=true)', () => {
    const out = core.replaceDelimitersWithTokens(
      `<p>${options.getPrefix()}unknown${options.getSuffix()}</p>`
    )
    assert.strictEqual(out, `<p>${options.getPrefix()}unknown${options.getSuffix()}</p>`)
  })

  test('works with special regex characters in delimiters', () => {
    // reinitialize with overrides just for this case
    reinit({ mergetags_prefix: '.*(', mergetags_suffix: ')$' })
    const out = core.replaceDelimitersWithTokens('<p>.*(first_name)$</p>')
    assert.match(out, /data-mt-val="first_name"/)
  })
})

describe('insertByValue & migration', () => {
  test('insertByValue inserts a token at selection', () => {
    editor.setContent('<p><span id="spot"></span></p>')
    const spot = editor.getBody().querySelector('#spot')
    const rng = document.createRange()
    rng.selectNode(spot)
    editor.selection.setRng(rng)

    core.insertByValue('first_name')
    const token = editor.getBody().querySelector('[data-mt-val="first_name"]')
    assert.ok(token)
  })

  test('migrateOldTokens wraps braces', () => {
    editor.setContent(
      `<p><span class="${options.getTokenClass()}" data-mt-val="first_name" contenteditable="false">First Name</span></p>`
    )
    core.migrateOldTokens()
    const token = editor.getBody().querySelector(`.${options.getTokenClass()}`)
    assert.ok(token.querySelector('.' + options.getBraceClass()))
  })
})

describe('transformInitialContentOnce', () => {
  test('runs only once and migrates', () => {
    editor.setContent(`<p>${options.getPrefix()}first_name${options.getSuffix()}</p>`)
    core.transformInitialContentOnce()
    const first = editor.getBody().querySelectorAll(`.${options.getTokenClass()}`).length
    core.transformInitialContentOnce()
    const second = editor.getBody().querySelectorAll(`.${options.getTokenClass()}`).length
    assert.strictEqual(first, second)
  })
})
