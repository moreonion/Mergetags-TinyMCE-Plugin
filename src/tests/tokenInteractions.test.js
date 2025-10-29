import { describe, it, expect, vi, beforeEach } from 'vitest'
import TokenInteractions from '../tokens/tokenInteractions.js'

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
  createTokenElement: vi.fn((tag) => {
    const el = document.createElement('span')
    el.className = 'mt-token'
    el.setAttribute('data-mt-val', tag.value)
    el.textContent = tag.title || tag.value
    return el
  })
})

const makeStore = () => ({
  getByValue: (v) => ({ title: String(v).toUpperCase(), value: String(v) })
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
    const before = editor.getBody().innerHTML.length
    interactions.insertByValue('hello')
    const after = editor.getBody().innerHTML.length
    expect(after).toBeGreaterThan(before)
  })

  it('onContainerClick activates token or clears if none', () => {
    const interactions = new TokenInteractions(editor, options, renderer, store)
    const target = document.querySelector('.mt-token')
    const ev = { target: target, preventDefault: vi.fn() }
    interactions.onContainerClick(ev)
    expect(ev.preventDefault).toHaveBeenCalled()
    expect(target.classList.contains('active')).toBe(true)

    const none = { target: document.body, preventDefault: vi.fn() }
    interactions.onContainerClick(none)
    expect(document.querySelectorAll('.mt-token.active').length).toBe(0)
  })
})
