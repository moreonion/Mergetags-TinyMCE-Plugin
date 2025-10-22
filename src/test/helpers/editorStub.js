export const createEditorStub = () => {
  const handlers = new Map()
  const optionsStore = new Map()
  const commands = {}
  const icons = {}
  const menuButtons = {}
  const autocompleters = {}

  const body = document.createElement('div')
  body.setAttribute('contenteditable', 'true')

  const selectionState = {
    currentRange: null,
    currentNode: body
  }

  const encode = (s) => {
    const div = document.createElement('div')
    div.textContent = String(s)
    return div.innerHTML
  }

  const editor = {
    options: {
      register: function (key, def) {
        optionsStore.set(key, { default: def.default, value: undefined })
      },
      get: function (key) {
        const entry = optionsStore.get(key)
        return entry ? (entry.value !== undefined ? entry.value : entry.default) : undefined
      },
      set: function (key, value) {
        const entry = optionsStore.get(key)
        if (entry) entry.value = value
        else optionsStore.set(key, { default: undefined, value: value })
      }
    },

    ui: {
      registry: {
        addIcon: function (name, svg) { icons[name] = svg },
        addMenuButton: function (name, cfg) { menuButtons[name] = cfg },
        addNestedMenuItem: function (name, cfg) { menuButtons[name] = cfg },
        addAutocompleter: function (name, cfg) { autocompleters[name] = cfg }
      }
    },

    schema: {
      _valid: [],
      addValidElements: function (str) { this._valid.push(str) }
    },

    contentStyles: [],

    dom: {
      hasClass: function (el, cls) { return !!el && el.nodeType === 1 && el.classList.contains(cls) },
      getParent: function (node, predicate) {
        let cur = node
        while (cur && cur !== body) {
          if (predicate(cur)) return cur
          cur = cur.parentNode
        }
        return null
      },
      encode: encode
    },

    selection: {
      getRng: function () { return selectionState.currentRange },
      setRng: function (rng) { selectionState.currentRange = rng },
      getNode: function () { return selectionState.currentNode },
      setNode: function (node) {
        const rng = selectionState.currentRange
        if (!rng) { body.appendChild(node); selectionState.currentNode = node; return }
        const sc = rng.startContainer
        if (sc.nodeType === 3) {
          const parent = sc.parentNode || body
          parent.replaceChild(node, sc)
          selectionState.currentNode = node
        }
        else {
          sc.appendChild(node)
          selectionState.currentNode = node
        }
      },
      select: function (node) { selectionState.currentNode = node },
      collapse: function () {}
    },

    undoManager: {
      transact: function (fn) { return fn() }
    },

    addCommand: function (name, fn) { commands[name] = fn },
    _commands: commands,

    on: function (name, fn) {
      if (!handlers.has(name)) handlers.set(name, [])
      handlers.get(name).push(fn)
    },
    _emit: function (name, payload) {
      (handlers.get(name) || []).forEach(function (fn) { fn(payload) })
    },

    getDoc: function () { return document },
    getBody: function () { return body },
    getContent: function ({ format }) { return format === 'html' ? body.innerHTML : body.textContent },
    setContent: function (html) { body.innerHTML = html },

    _icons: icons,
    _menuButtons: menuButtons,
    _autocompleters: autocompleters
  }

  return editor
}
