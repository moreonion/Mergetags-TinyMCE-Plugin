export default class State {
  /**
   * @param {import('../settings/Options.js').Options} options
   */
  constructor (options) {
    this.options = options
    this.groupedTokens = []
    this.flatTokens = []
    this.valueMap = new Map()
    this.uidCounter = 0
    this._didInitPass = false
  }

  /**
 * Normalize the configured token groups into a sane structure.
 * @param {Array<object>} input
 * @returns {Array<object>} Normalized groups.
 */

  static normalizeGroups (input) {
    if (!Array.isArray(input)) return []
    return input
      .map((item) => {
        const groupItems = item.menu || item.items
        if (Array.isArray(groupItems)) return { title: String(item.title || ''), menu: State.normalizeGroups(groupItems) }
        if (typeof item.value !== 'undefined') return { title: String(item.title || item.value), value: String(item.value) }
        return null
      })
      .filter(Boolean)
  }

  static flatten (items, acc = []) {
    for (const item of items) {
      if (Array.isArray(item.menu)) State.flatten(item.menu, acc)
      else if (typeof item.value !== 'undefined') acc.push({ title: String(item.title || item.value), value: String(item.value) })
    }
    return acc
  }

  rebuildIndex () {
    this.flatTokens = State.flatten(this.groupedTokens, [])
    this.valueMap = new Map(this.flatTokens.map((t) => [t.value, t]))
  }

  refreshFromOptions = () => {
    const list = this.options.getList()
    this.groupedTokens = State.normalizeGroups(list)
    this.rebuildIndex()
  }

  /**
 * Replace the current token groups and rebuild indexes.
 * @param {Array<object>} data
 * @returns {void}
 */

  setTokens = (data) => {
    this.groupedTokens = State.normalizeGroups(data || [])
    this.rebuildIndex()
  }

  /**
 * Generate the next unique id for token instances.
 * @returns {string}
 */

  nextUid = () => {
    this.uidCounter += 1
    return this.uidCounter.toString(36)
  }
  /** @returns {boolean} Whether initial transformation has been performed. */

  get didInitPass () { return this._didInitPass }

  /**
 * Mark whether the initial transformation pass has been performed.
 * @param {boolean} v
 */

  set didInitPass (v) { this._didInitPass = !!v }
}
