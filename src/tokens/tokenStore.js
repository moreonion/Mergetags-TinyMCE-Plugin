class TokenStore {
  #groups = []
  #flat = []
  #byValue = new Map()

  // Normalize user-provided token config (arbitrary shape) into groups/tokens
  static normalizeGroups (input) {
    if (!Array.isArray(input)) return []
    return input
      .map((item) => {
        const groupItems = item?.menu ?? item?.items
        if (Array.isArray(groupItems)) {
          return {
            title: String(item?.title ?? ''),
            menu: TokenStore.normalizeGroups(groupItems)
          }
        }
        if (typeof item?.value !== 'undefined') {
          return {
            title: String(item?.title ?? item.value),
            value: String(item.value)
          }
        }
        return null
      })
      .filter(Boolean)
  }

  // Depth-first flatten of normalized groups to tokens
  static flatten (items, acc = []) {
    for (const item of items) {
      if (Array.isArray(item?.menu)) TokenStore.flatten(item.menu, acc)
      else if (typeof item?.value !== 'undefined') {
        acc.push({
          title: String(item.title ?? item.value),
          value: String(item.value)
        })
      }
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
    this.setTokens(options?.getList?.())
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

  getGroups () { return this.#groups }

  getByValue (value) { return this.#byValue.get(String(value)) }
}

export default TokenStore
