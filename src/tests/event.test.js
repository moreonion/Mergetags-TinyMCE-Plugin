import { test, assert, vi, beforeEach } from 'vitest'
import { createEditorStub } from './helpers/editorStub.js'
import Options from '../options.js'
import Core from '../core.js'
import Event from '../event.js'

let editor, options, core, events

beforeEach(() => {
  editor = createEditorStub()
  options = new Options(editor)
  options.register()
  core = new Core(editor, options)
  events = new Event(editor, core)
})

test('GetContent converts tokens to delimiters', () => {
  const span = document.createElement('span')
  span.setAttribute('class', options.getTokenClass())
  span.setAttribute('data-mt-val', 'first')
  span.setAttribute('contenteditable', 'false')
  span.innerHTML = `<span class="${options.getBraceClass()}">${options.getPrefix()}</span>First<span class="${options.getBraceClass()}">${options.getSuffix()}</span>`
  editor.getBody().appendChild(span)

  events.bindAll()
  const e = { content: editor.getBody().innerHTML }
  editor._emit('GetContent', e)

  assert(e.content, '{{first}}')
})

test('BeforeSetContent converts delimiters to tokens', () => {
  events.bindAll()
  const e = { content: `${options.getPrefix()}first${options.getSuffix()}` }
  // seed tokens so the transformer knows this token
  core.setTokens([{ title: 'Group', menu: [{ title: 'First', value: 'first' }] }])
  editor._emit('BeforeSetContent', e)
  assert.match(e.content, /data-mt-val="first"/)
})

test('init and remove attach/detach click handler', () => {
  const addSpy = vi.spyOn(editor.getContainer(), 'addEventListener')
  const rmSpy = vi.spyOn(editor.getContainer(), 'removeEventListener')
  events.bindAll()
  editor._emit('init')
  assert.isTrue(addSpy.mock.calls.length >= 1)
  editor._emit('remove')
  assert.isTrue(rmSpy.mock.calls.length >= 1)
})
