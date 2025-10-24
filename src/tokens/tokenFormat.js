import { escapeForRegex } from '../utils/escape.js'

// TokenFormat — tiny helper around how tokens look and are detected;
// single responsibility: read prefix/suffix/classes and provide helpers to build regexes and check DOM nodes
export default class TokenFormat {
  constructor (options) {
    this.options = options
  }

  getPrefix () { return this.options.getPrefix() }

  getSuffix () { return this.options.getSuffix() }

  getTokenClass () { return this.options.getTokenClass() }

  // Build a regex that matches {{ any-content }} between current prefix/suffix; @param {string} flags e.g. 'g', 'gi'
  getDelimiterRegex (flags = 'g') {
    const prefix = escapeForRegex(this.getPrefix())
    const suffix = escapeForRegex(this.getSuffix())
    return new RegExp(`${prefix}([\\s\\S]*?)${suffix}`, flags)
  }

  // Wrap a raw value with delimiters, e.g. -> {{ value }}
  wrap (value) {
    return `${this.getPrefix()}${String(value)}${this.getSuffix()}`
  }
}
