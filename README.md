KaTeX plugin for CKEditor 4
&nbsp; [![npm](https://img.shields.io/npm/v/katex-ckeditor-plugin?style=flat-square)](https://www.npmjs.com/package/katex-ckeditor-plugin)
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

### Screenshots:

![image](https://user-images.githubusercontent.com/4932134/71089547-eb1ade00-21c2-11ea-82c0-d5bfa8136d71.png)
![image](https://user-images.githubusercontent.com/4932134/71089560-f5d57300-21c2-11ea-8334-cf3af20fc3ba.png)
