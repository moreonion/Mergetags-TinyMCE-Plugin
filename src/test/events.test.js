import { describe, test, assert, vi, beforeEach } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import { registerOptions, getters as settingsGetters } from '../settings.js'
import { createState } from '../state.js'
import { makeCore } from '../core.js'
import { bindEvents, registerCommands } from '../events.js'

let editor, getters, pluginState, core
const sampleToken = { title: 'First', value: 'first' }
const getTokenHTML = () => core.toSpanHTML(sampleToken)

beforeEach(() => {
  editor = createEditorStub()
  registerOptions(editor)
  getters = settingsGetters(editor)
  pluginState = createState(editor)
  pluginState.setTokens([{ title: 'Menu', menu: [sampleToken] }])
  core = makeCore(editor, getters, pluginState)
})

describe('bindEvents', () => {
  test('PreInit adds schema + styles and refreshes options', () => {
    const refreshSpy = vi.spyOn(pluginState, 'refreshFromOptions')
    bindEvents(editor, getters, pluginState, core)

    editor._emit('PreInit')
    assert.isTrue(refreshSpy.mock.calls.length >= 1)

    editor._emit('PreInit')
    assert.isTrue(editor.schema._valid.some(schema => schema.includes('span[class|contenteditable|data-mt-val|data-mt-uid]')))
    assert.isTrue(editor.contentStyles.length >= 2)
  })

  test('GetContent converts tokens to delimiters', () => {
    bindEvents(editor, getters, pluginState, core)
    const event = { content: getTokenHTML() }
    editor._emit('GetContent', event)
    assert.strictEqual(event.content, `${getters.getPrefix()}${sampleToken.value}${getters.getSuffix()}`)
  })

  test('convert delimiters to tokens', () => {
    bindEvents(editor, getters, pluginState, core)

    const beforeSetContentEvent = { content: `Hello ${getters.getPrefix()}${sampleToken.value}${getters.getSuffix()}` }
    editor._emit('BeforeSetContent', beforeSetContentEvent)
    assert.match(beforeSetContentEvent.content, /data-mt-val="first"/)

    const pastePreProcessEvent = { content: `X ${getters.getPrefix()}${sampleToken.value}${getters.getSuffix()} Y` }
    editor._emit('PastePreProcess', pastePreProcessEvent)
    assert.match(pastePreProcessEvent.content, /data-mt-val="first"/)
  })

  test('keydown inside token removes the token', () => {
    editor.setContent(`<p>${getTokenHTML()}</p>`)
    const tokenElement = editor.getBody().querySelector(`.${getters.getTokenClass()}`)

    editor.selection.select(tokenElement)
    const keydownEvent = { preventDefault: vi.fn() }
    bindEvents(editor, getters, {}, core)
    editor._emit('keydown', keydownEvent)

    assert.strictEqual(editor.getBody().querySelector(`.${getters.getTokenClass()}`), null)
    assert.strictEqual(keydownEvent.preventDefault.mock.calls.length, 1)
  })

  test('NodeChange keeps selection sane inside tokens', () => {
    editor.setContent(`<p>${getTokenHTML()}</p>`)
    const tokenElement = editor.getBody().querySelector(`.${getters.getTokenClass()}`)
    bindEvents(editor, getters, {}, core)
    const tokenChild = tokenElement.firstChild
    editor._emit('NodeChange', { element: tokenChild })
    assert.strictEqual(editor.selection.getNode(), tokenElement)
  })

  test('init registers click handler and transformInitialContentOnce runs via LoadContent', () => {
    pluginState.didInitPass = false
    bindEvents(editor, getters, pluginState, core)
    editor.setContent(`<p>${getters.getPrefix()}${sampleToken.value}${getters.getSuffix()}</p>`)
    editor._emit('LoadContent')
    const tokenElement = editor.getBody().querySelector(`.${getters.getTokenClass()}`)
    assert.ok(tokenElement)
  })

  test('remove detaches click listener (no throw)', () => {
    bindEvents(editor, getters, pluginState, core)
    editor._emit('init')
    editor._emit('remove')
    assert.ok(true)
  })
})

describe('registerCommands', () => {
  test('mergetags:insert inserts token by value', () => {
    registerCommands(editor, pluginState, core)
    editor.setContent('<p><span id="spot"></span></p>')
    const spotElement = editor.getBody().querySelector('#spot')
    const selectionRange = document.createRange()
    selectionRange.selectNode(spotElement)
    editor.selection.setRng(selectionRange)

    editor._commands['mergetags:insert'](false, { value: sampleToken.value })
    const tokenElement = editor.getBody().querySelector('[data-mt-val="first"]')
    assert.ok(tokenElement)
  })

  test('mergetags:setTokens updates list and converts existing delimiters', () => {
    const migrateSpy = vi.spyOn(core, 'migrateOldTokens')
    registerCommands(editor, pluginState, core)

    editor.setContent(`<p>Hello ${getters.getPrefix()}${sampleToken.value}${getters.getSuffix()}</p>`)
    editor._commands['mergetags:setTokens'](false, [{ title: 'Menu', items: [{ value: sampleToken.value }] }])
    const tokenElement = editor.getBody().querySelector('[data-mt-val="first"]')
    assert.ok(tokenElement)
    assert.isTrue(migrateSpy.mock.calls.length >= 1)
  })
})
