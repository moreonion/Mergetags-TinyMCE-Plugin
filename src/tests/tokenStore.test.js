import { describe, it, expect } from 'vitest'
import TokenStore from '../tokens/tokenStore.js'

describe('TokenStore', () => {
  it('throws when a token has no value', () => {
    expect(() => TokenStore.normalizeToken({ title: 'Missing Value' }))
      .toThrow('Token value is required')
  })
})
