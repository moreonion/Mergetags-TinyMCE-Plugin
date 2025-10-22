import { describe, test, assert, vi, beforeEach } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import Core from '../core.js'
import Event from '../event.js'
import Commands from '../commands.js'

let editor, options, core, events, commands
const sampleToken = { title: 'First', value: 'first' }
const getTokenHTML = () => core.toSpanHTML(sampleToken)

beforeEach(() => {
  editor = createEditorStub()
  options = new Options(editor)
  options.register()
  core = new Core(editor, options)
  core.setTokens([{ title: 'Menu', items: [{ value: sampleToken.value }] }])
  events = new Event(editor, core)
  commands = new Commands(editor, core)
})

describe('Event.bindAll', () => {
  test('registers schema/styles on PreInit', () => {
    const refreshSpy = vi.spyOn(core, 'refreshTokensFromOptions')
    events.bindAll()

    editor._emit('PreInit')
    assert.isTrue(refreshSpy.mock.calls.length >= 1)
    assert.isTrue(editor.schema._valid.some(s => s.includes('span[class|contenteditable|data-mt-val|data-mt-uid]')))
    assert.isTrue(editor.contentStyles.length >= 2)
  })

  test('GetContent converts tokens to delimiters', () => {
    events.bindAll()
    const event = { content: getTokenHTML() }
    editor._emit('GetContent', event)
    assert.strictEqual(event.content, `${options.getPrefix()}${sampleToken.value}${options.getSuffix()}`)
  })

  test('BeforeSetContent/SetContent convert delimiters to tokens', () => {
    events.bindAll()
    const before = { content: `Hello ${options.getPrefix()}${sampleToken.value}${options.getSuffix()}` }
    editor._emit('BeforeSetContent', before)
    editor.setContent(before.content)
    const token = editor.getBody().querySelector('[data-mt-val="first"]')
    assert.ok(token)
  })
})

describe('Commands.register', () => {
  test('mergetags:insert inserts token by value', () => {
    commands.register()
    editor.setContent('<p><span id="spot"></span></p>')
    const spot = editor.getBody().querySelector('#spot')
    const rng = document.createRange()
    rng.selectNode(spot)
    editor.selection.setRng(rng)

    editor._commands['mergetags:insert'](false, { value: sampleToken.value })
    const token = editor.getBody().querySelector('[data-mt-val="first"]')
    assert.ok(token)
  })

  test('mergetags:setTokens updates list and converts existing delimiters', () => {
    const migrateSpy = vi.spyOn(core, 'migrateOldTokens')
    commands.register()

    editor.setContent(`<p>Hello ${options.getPrefix()}${sampleToken.value}${options.getSuffix()}</p>`)
    editor._commands['mergetags:setTokens'](false, [{ title: 'Menu', items: [{ value: sampleToken.value }] }])
    const token = editor.getBody().querySelector('[data-mt-val="first"]')
    assert.ok(token)
    assert.isTrue(migrateSpy.mock.calls.length >= 1)
  })
})
