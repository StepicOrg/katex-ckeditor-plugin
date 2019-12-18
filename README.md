KaTeX plugin for CKEditor 4
----------------

### Installation:

- Copy files to the "plugins" folder of CKEditor,
  then add `config.extraPlugins = 'katex';` in config.js.

  Please note, source code is ECMAScript 2016+. If you need to support old
  browsers, transpile the code by running `npm run build`, then use `dist/` folder.

- Or use official builder "https://ckeditor.com/cke4/builder".

### Configuration:

```js
// [Required] Pathes to the CSS and JS files of katex library.
config.katexLibCss = '';
config.katexLibJs = '';

// Default class of an element that will be converted into a widget.
config.katexClass = 'math-tex';

// List of delimiters to look for math. Each delimiter is array of:
// left delimiter (String), right delimiter (String), display mode (Boolean).
// By default `\(` and `\[` are used, but `$` and `$$` are also supported.
config.katexDelimiters = [...];

// Additional options to pass into `katex.renderToString`.
config.katexOptions = {...};
```
