import TokenStore from './tokens/tokenStore.js'

export default class State {
  constructor (options) {
    this.options = options
    this.tokens = new TokenStore()
  }

  refreshFromOptions = () => {
    this.tokens.refreshFromOptions(this.options)
  }

  setTokens = (data) => {
    this.tokens.setTokens(data)
  }
}
