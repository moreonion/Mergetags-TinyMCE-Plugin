const normalizeGroups = (input) => {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      const groupItems = item.menu || item.items
      if (Array.isArray(groupItems)) return { title: String(item.title || ''), menu: normalizeGroups(groupItems) }
      if (typeof item.value !== 'undefined') return { title: String(item.title || item.value), value: String(item.value) }
      return null
    })
    .filter(Boolean)
}

const flatten = (items, accumulator = []) => {
  for (const item of items) {
    if (Array.isArray(item.menu)) flatten(item.menu, accumulator)
    else if (typeof item.value !== 'undefined') accumulator.push({ title: String(item.title || item.value), value: String(item.value) })
  }
  return accumulator
}

export const createState = (editor) => {
  let groupedTokens = []
  let flat = []
  let map = new Map()
  let uidCounter = 0
  let didInitPass = false

  const rebuildIndex = () => {
    flat = flatten(groupedTokens, [])
    map = new Map(flat.map((token) => [token.value, token]))
  }

  const refreshFromOptions = () => {
    const fromList = editor.options.get('mergetags_list')
    groupedTokens = normalizeGroups(fromList)
    rebuildIndex()
  }

  const setTokens = (data) => {
    groupedTokens = normalizeGroups(data || [])
    rebuildIndex()
  }

  const nextUid = () => {
    uidCounter += 1
    return uidCounter.toString(36)
  }

  return {
    get grouped () { return groupedTokens },
    get flat () { return flat },
    get map () { return map },
    get didInitPass () { return didInitPass },
    set didInitPass (value) { didInitPass = !!value },

    rebuildIndex,
    refreshFromOptions,
    setTokens,
    nextUid,
  }
}
