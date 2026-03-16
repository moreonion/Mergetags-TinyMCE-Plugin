import { describe, it, expect, vi, beforeEach } from 'vitest'
import TokenInteractions from '../tokens/tokenInteractions.js'

const confirmationMarkup = '<a href="{{confirmation.url}}">{{confirmation.url}}</a>'

const setupDOM = () => {
  document.body.innerHTML = `
    <div id="root">
      <span class="mt-token active">A</span>
      <span class="mt-token">B</span>
      <span class="mt-token">C</span>
    </div>
  `
  return {
    root: document.getElementById('root'),
    tokens: Array.from(document.querySelectorAll('.mt-token'))
  }
}

const makeEditorStub = () => ({
  getBody: () => document.getElementById('root'),
  dom: {
    getParent: (node, pred) => {
      let cur = node
      while (cur && cur !== document.body) {
        if (pred(cur)) return cur
        cur = cur.parentNode
      }
      return null
    },
    hasClass: (el, cls) => el.classList.contains(cls)
  },
  selection: {
    select: vi.fn(),
    collapse: vi.fn(),
    setNode: vi.fn()
  },
  undoManager: {
    transact: (fn) => {
      document.body.innerHTML = `
    <div id="root">
      <span class="mt-token active">A</span>
      <span class="mt-token">B</span>
      <span class="mt-token">C</span>
      <span class="mt-token">D</span>
    </div>
  `
      if (typeof fn === 'function') fn()
    }
  }
})

const makeOptions = () => ({
  getTokenClass: () => 'mt-token',
  getActiveClass: () => 'active'
})

const makeRenderer = () => ({
  createInsertionNode: vi.fn((tag) => {
    if (tag.markup === undefined) {
      const el = document.createElement('span')
      el.className = 'mt-token'
      el.setAttribute('data-mt-val', tag.value)
      el.textContent = tag.title || tag.value
      return el
    }
    return document.createRange().createContextualFragment(tag.markup).firstChild
  }),
  createTokenElement: vi.fn((tag) => {
    const el = document.createElement('span')
    el.className = 'mt-token'
    el.setAttribute('data-mt-val', tag.value)
    el.textContent = tag.title || tag.value
    return el
  })
})

const makeStore = () => ({
  getByValue: (v) => {
    const value = String(v)
    return value === 'confirmation.url'
      ? {
          title: 'CONFIRMATION.URL',
          value: value,
          markup: confirmationMarkup
        }
      : { title: value.toUpperCase(), value: value }
  }
})

describe('TokenInteractions', () => {
  let editor, options, renderer, store

  beforeEach(() => {
    setupDOM()
    editor = makeEditorStub()
    options = makeOptions()
    renderer = makeRenderer()
    store = makeStore()
  })

  it('clears and activates tokens', () => {
    const interactions = new TokenInteractions(editor, options, renderer, store)

    // Initially one active
    expect(document.querySelectorAll('.mt-token.active').length).toBe(1)

    interactions.clearActiveTokens()
    expect(document.querySelectorAll('.mt-token.active').length).toBe(0)

    const el = document.querySelectorAll('.mt-token')[1]
    interactions.activateToken(el)
    expect(el.classList.contains('active')).toBe(true)
    expect(editor.selection.select).toHaveBeenCalledWith(el)
    expect(editor.selection.collapse).toHaveBeenCalledWith(false)
  })

  it('insertByValue inserts a created element', () => {
    const interactions = new TokenInteractions(editor, options, renderer, store)
    interactions.insertByValue('hello')
    const insertedNode = editor.selection.setNode.mock.calls[0][0]

    expect(renderer.createInsertionNode).toHaveBeenCalledWith({ title: 'HELLO', value: 'hello' })
    expect(insertedNode.outerHTML).toBe('<span class="mt-token" data-mt-val="hello">HELLO</span>')
  })

  it('insertByValue renders token markup as normal HTML', () => {
    const interactions = new TokenInteractions(editor, options, renderer, store)
    interactions.insertByValue('confirmation.url')
    const insertedNode = editor.selection.setNode.mock.calls[0][0]

    expect(renderer.createInsertionNode).toHaveBeenCalledWith({
      title: 'CONFIRMATION.URL',
      value: 'confirmation.url',
      markup: confirmationMarkup
    })
    expect(insertedNode.outerHTML).toBe(confirmationMarkup)
  })

  it('activateTokenOnClick activates token or clears if none', () => {
    const interactions = new TokenInteractions(editor, options, renderer, store)
    const target = document.querySelector('.mt-token')
    const ev = { target: target, preventDefault: vi.fn() }
    interactions.activateTokenOnClick(ev)
    expect(ev.preventDefault).toHaveBeenCalled()
    expect(target.classList.contains('active')).toBe(true)

    const none = { target: document.body, preventDefault: vi.fn() }
    interactions.activateTokenOnClick(none)
    expect(document.querySelectorAll('.mt-token.active').length).toBe(0)
  })
})
