// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  globals: {},
  plugins: [
    'vitest'
  ],
  extends: [
    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    'standard',
    'plugin:vitest/recommended'
  ],
  // add your custom rules here
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // allow trailing comma in multline lists and objects
    'comma-dangle': ['error', 'only-multiline'],
    // don’t enforce object shorthand
    'object-shorthand': ['error', 'consistent'],
    // enforce new line between '}' and 'else'
    'brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
    // allow assert in tests
    'vitest/expect-expect': ['error', { assertFunctionNames: ['assert', 'expect'] }]
  }
}
