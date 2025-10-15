# MergeTags Plugin

A **custom TinyMCE plugin** for inserting merge tags (dynamic placeholders) into the editor content.

---

## Compatibility

Compiled bundles include:

- `plugin.min.js` → IIFE bundle for use with TinyMCE external plugins

---

## Usage

The plugin registers a TinyMCE toolbar button and menu item for inserting merge tags.

1. Include the plugin as an external TinyMCE plugin (e.g. `external_plugins: { mergetags: '/plugins/mergetags/plugin.js' }`).  
2. Configure available tags via TinyMCE init options.  
3. When used, the plugin inserts a placeholder like `{{First Name}}` into the editor content.

**Example:**

```js
tinymce.init({
  selector: '#editor',
  external_plugins: {
    mergetags: '/plugins/mergetags/plugin.min.js',
  },
  mergetags_list: [
    { title: 'First Name', value: 'first_name' },
    { title: 'Email', value: 'email' },
  ],
  toolbar: 'mergetags',
});
```

## Development

Install `nodejs` and `yarn`, then install the needed dependencies:

    yarn install

Use the different `yarn` scripts for the development workflow:

    yarn dev
    yarn test
    yarn lint
    yarn fix

For building releaseable artifacts (library files) use:

    yarn build

The releasable files are configured to be created under `dist/`.

### Debug mode

To enable debug mode in the browser set `sessionStorage.setItem('mo_debug', 1)`.

### Testing

Test framework: [vitest](https://vitest.dev)
