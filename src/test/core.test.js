import { describe, test, assert } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import { registerOptions, getters } from '../settings.js'
import { createState } from '../state.js'
import { makeCore } from '../core.js'

const setup = (options = {}) => {
  const editor = createEditorStub()
  registerOptions(editor)
  for (const [key, value] of Object.entries(options)) editor.options.set(key, value)
  const get = getters(editor)
  const state = createState(editor)
  state.setTokens([
    { title: 'User', menu: [{ title: 'First Name', value: 'first_name' }, { title: 'Last', value: 'last_name' }] }
  ])
  const core = makeCore(editor, get, state)
  return { editor, get, state, core }
}

describe('createTokenElement & toSpanHTML', () => {
  test('renders token element with braces and attributes', () => {
    const { core, get } = setup()
    const el = core.createTokenElement({ title: 'First Name', value: 'first_name' }, 'abc')
    assert.strictEqual(el.getAttribute('class'), get.getTokenClass())
    assert.strictEqual(el.getAttribute('data-mt-val'), 'first_name')
    assert.strictEqual(el.getAttribute('data-mt-uid'), 'abc')
    assert.strictEqual(el.getAttribute('contenteditable'), 'false')
    const braces = el.querySelectorAll('.' + get.getBraceClass())
    assert.strictEqual(braces.length, 2)
    assert.strictEqual(braces[0].textContent, get.getPrefix())
    assert.strictEqual(braces[1].textContent, get.getSuffix())
    assert.include(el.textContent, '{{first_name}')
  })

  test('toSpanHTML encodes attributes and text', () => {
    const { core } = setup()
    const html = core.toSpanHTML({ title: 'A<B>', value: 'a&b"c<d>e' }, '9')
    assert.include(html, 'data-mt-val="a&amp;b&quot;c&lt;d&gt;e"')
    assert.include(html, '&lt;')
  })
})

describe('replaceTokensWithDelimiters', () => {
  test('converts token spans to {{value}} text', () => {
    const { core, get } = setup()
    const tokenClass = get.getTokenClass()
    const braceClass = get.getBraceClass()
    const html = `<p>Hello <span class="${tokenClass}" data-mt-val="first_name" contenteditable="false">
      <span class="${braceClass}">{{</span>First Name<span class="${braceClass}">}}</span></span>!</p>`
    const out = core.replaceTokensWithDelimiters(html)
    assert.strictEqual(out.replace(/\s+/g, ''), `<p>Hello ${get.getPrefix()}first_name${get.getSuffix()}!</p>`.replace(/\s+/g, ''))
  })
})

describe('replaceDelimitersWithTokens', () => {
  test('converts {{value}} to token span using state map', () => {
    const { core, get } = setup()
    const out = core.replaceDelimitersWithTokens(`<p>Hi ${get.getPrefix()}first_name${get.getSuffix()}!</p>`)
    assert.match(out, /<span[^>]+data-mt-val="first_name"/)
  })

  test('leaves unknown values intact', () => {
    const { core, get } = setup()
    const out = core.replaceDelimitersWithTokens(`<p>${get.getPrefix()}unknown${get.getSuffix()}</p>`)
    assert.strictEqual(out, `<p>${get.getPrefix()}unknown${get.getSuffix()}</p>`)
  })

  test('works with special regex characters in delimiters', () => {
    const { core } = setup({ mergetags_prefix: '.*(', mergetags_suffix: ')$' })
    const out = core.replaceDelimitersWithTokens('<p>.*(first_name)$</p>')
    assert.match(out, /data-mt-val="first_name"/)
  })
})

describe('upgradeRawUnderCaret', () => {
  test('replaces raw {{value}} under caret with token and activates it', () => {
    const { editor, core, get } = setup()
    editor.setContent(`<p>Hello ${get.getPrefix()}first_name${get.getSuffix()}!</p>`)
    const textNode = editor.getBody().firstChild.firstChild
    const rng = document.createRange()
    rng.setStart(textNode, textNode.length || 0)
    rng.setEnd(textNode, textNode.length || 0)
    editor.selection.setRng(rng)

    const ok = core.upgradeRawUnderCaret()
    assert.isTrue(ok)

    const token = editor.getBody().querySelector(`.${get.getTokenClass()}`)
    assert.ok(token)
    assert.isTrue(token.classList.contains(get.getActiveClass()))
  })
})

describe('migrateOldTokens', () => {
  test('wraps old tokens into new structure', () => {
    const { editor, core, get } = setup()
    editor.setContent(`<p><span class="${get.getTokenClass()}" data-mt-val="first_name" contenteditable="false">First Name</span></p>`)
    core.migrateOldTokens()
    const token = editor.getBody().querySelector(`.${get.getTokenClass()}`)
    assert.ok(token.querySelector('.' + get.getBraceClass()))
  })
})

describe('transformInitialContentOnce', () => {
  test('runs only once and migrates', () => {
    const { editor, core, state, get } = setup()
    state.didInitPass = false
    editor.setContent(`<p>${get.getPrefix()}first_name${get.getSuffix()}</p>`)
    core.transformInitialContentOnce()
    const first = editor.getBody().querySelectorAll(`.${get.getTokenClass()}`).length
    core.transformInitialContentOnce()
    const second = editor.getBody().querySelectorAll(`.${get.getTokenClass()}`).length
    assert.strictEqual(first, second)
  })
})

describe('activate/clear + insertTag + buildMenuItems', () => {
  test('activate/clear toggles active class & selection', () => {
    const { editor, core, get } = setup()
    const token = core.createTokenElement({ title: 'First', value: 'first_name' })
    editor.getBody().appendChild(token)
    core.activateToken(token)
    assert.isTrue(token.classList.contains(get.getActiveClass()))
    core.clearActiveTokens()
    assert.isFalse(token.classList.contains(get.getActiveClass()))
  })

  test('insertTag inserts a token at selection', () => {
    const { editor, core, get } = setup()
    editor.setContent('<p>Here: <span id="spot"></span></p>')
    const spot = editor.getBody().querySelector('#spot')
    const rng = document.createRange()
    rng.selectNode(spot)
    editor.selection.setRng(rng)

    core.insertTag({ title: 'First Name', value: 'first_name' })
    const token = editor.getBody().querySelector(`.${get.getTokenClass()}`)
    assert.ok(token)
    assert.strictEqual(token.getAttribute('data-mt-val'), 'first_name')
  })

  test('buildMenuItems returns nested and leaf menuitems', () => {
    const { core } = setup()
    const items = core.buildMenuItems([{ title: 'Group', menu: [{ title: 'First', value: 'first_name' }] }])
    assert.strictEqual(items[0].type, 'nestedmenuitem')
    const leaf = items[0].getSubmenuItems()[0]
    assert.strictEqual(leaf.type, 'menuitem')
  })

  test('buildMenuItems returns "No tags" for empty', () => {
    const { core } = setup()
    const items = core.buildMenuItems([])
    assert.strictEqual(items[0].text, 'No tags')
    assert.isFalse(items[0].enabled)
  })
})
