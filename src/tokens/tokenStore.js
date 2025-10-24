export class TokenStore {
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

  // Pulls the list from options (kept here to avoid leaking normalize logic); @param {{ getList: () => any[] }} options
  refreshFromOptions (options) {
    const list = options?.getList?.() ?? []
    this.#groups = TokenStore.normalizeGroups(list)
    this.#rebuild()
  }

  // Recompute flat + maps from groups
  #rebuild () {
    this.#flat = TokenStore.flatten(this.#groups, [])
    this.#byValue = new Map(this.#flat.map((t) => [t.value, t]))
  }

  getGroups () { return this.#groups }

  getFlat () { return this.#flat }

  getByValue (value) { return this.#byValue.get(String(value)) }

  hasValue (value) { return this.#byValue.has(String(value)) }

  values () { return this.#byValue.keys() }
}

export default TokenStore
