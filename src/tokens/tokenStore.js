class TokenStore {
  #groups = []
  #flat = []
  #byValue = new Map()

  static normalizeToken (item) {
    if (typeof item.value === 'undefined') {
      throw new Error('Token value is required')
    }
    return {
      title: String(item.title ?? item.value),
      value: String(item.value),
      markup: item.markup
    }
  }

  // Normalize user-provided token config into groups/tokens.
  static normalizeGroups (input) {
    if (!Array.isArray(input)) return []
    return input
      .map((item) => {
        const groupItems = item.menu ?? item.items
        if (Array.isArray(groupItems)) {
          return {
            title: String(item.title ?? ''),
            menu: TokenStore.normalizeGroups(groupItems)
          }
        }
        return TokenStore.normalizeToken(item)
      })
  }

  // Depth-first flatten of normalized groups to tokens
  static flatten (items, acc = []) {
    for (const item of items) {
      if (Array.isArray(item.menu)) TokenStore.flatten(item.menu, acc)
      else acc.push(item)
    }
    return acc
  }

  // Replace groups and rebuild indexes; @param {any[]} data
  setTokens (data) {
    this.#groups = TokenStore.normalizeGroups(data ?? [])
    this.#rebuild()
  }

  // Pulls the list from options (kept here to avoid leaking normalize logic)
  refreshFromOptions (options) {
    this.setTokens(options.getList())
  }

  // Recompute flat + maps from groups
  #rebuild () {
    this.#flat = TokenStore.flatten(this.#groups, [])
    this.#byValue = new Map(this.#flat.map((t) => [t.value, t]))
  }

  autocomplete (pattern, maxResults) {
    const q = (pattern || '').toLowerCase()
    const list = this.#flat
    const filtered = q
      ? list.filter(t => (t.title || t.value).toLowerCase().includes(q) || t.value.toLowerCase().includes(q))
      : list.slice()
    const cap = Math.min(
      typeof maxResults === 'number' ? maxResults : 10,
      filtered.length
    )
    return filtered.slice(0, cap).map(t => ({ text: t.title || t.value, value: t.value }))
  }

  buildMenuItems = (interactions) => {
    if (!this.#groups.length) {
      return [{ type: 'menuitem', text: 'No tags', enabled: false }]
    }

    const tokenToItem = (t) => ({
      type: 'menuitem',
      text: t.title,
      onAction: () => interactions.insertTag(t)
    })

    return this.#groups.map((item) => {
      if (Array.isArray(item.menu)) {
        return {
          type: 'nestedmenuitem',
          text: item.title ?? '',
          getSubmenuItems: () => item.menu.map(tokenToItem)
        }
      }
      return tokenToItem(item)
    })
  }

  getGroups () { return this.#groups }

  getByValue (value) { return this.#byValue.get(String(value)) }
}

export default TokenStore
