'use strict';

/**
 * KaTeX plugin for CKEditor 4
 * ----------------
 *
 * ##### Installation:
 * - Copy files to the "plugins" folder of CKEditor, then add
 *   `config.extraPlugins = 'katex';` in config.js.
 * - Or use official builder "https://ckeditor.com/cke4/builder".
 *
 * ##### Configuration:
 * ```js
 * // [Required] Pathes to the CSS and JS files of katex library.
 * config.katexLibCss = '';
 * config.katexLibJs = '';
 *
 * // Default class of an element that will be converted into a widget.
 * config.katexClass = 'math-tex';
 *
 * // List of delimiters to look for math. Each delimiter is array of:
 * // left delimiter (String), right delimiter (String), display mode (Boolean).
 * // By default `\(` and `\[` are used, but `$` and `$$` are also supported.
 * config.katexDelimiters = [...];
 *
 * // Additional options to pass into `katex.renderToString`.
 * config.katexOptions = {...};
 * ```
 */
(function() {
  function KatexWidgetDefinition(editor) {
    const katexClass = editor.config.katexClass || 'math-tex';

    const WidgetDefinition = {
      inline: true,
      button: 'Math',
      pathName: 'math',
      dialog: 'katexEdit',
      mask: true,
      requiredContent: 'span(' + katexClass + ')',
      allowedContent: 'span(!' + katexClass + ')',
      styleableElements: 'span',
      template: '<span class="' + katexClass + '"></span>',
      parts: { span: 'span' },
      defaults: {
        math: '\\(x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}\\)'
      },

      _delimiters: editor.config.katexDelimiters || [
        ['\\(', '\\)', false],
        ['\\[', '\\]', true],
        ['$$', '$$', true],
        ['$', '$', false]
      ],

      _katexOptions: Object.assign({
        output: 'html',
        throwOnError: false
      }, editor.config.katexOptions),

      renderKatexHtml(math) {
        let html;
        const katex = window.katex;

          if (katex) {
          const { expr, displayMode } = this.parseMath(math);
          const options = Object.assign({}, this._katexOptions, { displayMode });
            html = katex.renderToString(expr || '(empty)', options);
          } else {
          const state = editor._.katex.state;
          const content = CKEDITOR.tools.htmlEncode(math);
            html = `<span data-no-katex="${state}">${content}</span>`;
          }

        return html;
      },

      renderKatex() {
        editor.fire('lockSnapshot');

        try {
          const html = this.renderKatexHtml(this.data.math);
          this.parts.span.setHtml(html);
        } finally {
          editor.fire('unlockSnapshot');
        }
      },

      parseMath(value) {
        if (!value) {
          return { expr: '', delimiter: null, displayMode: false };
        }

        value = value.trim();

        const delimiter = this._delimiters.find(
          d => value.startsWith(d[0]) && value.endsWith(d[1])
        );

        if (delimiter) {
          let expr = value.substring(
            delimiter[0].length,
            value.length - delimiter[1].length
          ).trim();
          let displayMode = !!delimiter[2];
          return { expr, delimiter, displayMode };
        }

        return { expr: value, delimiter: null, displayMode: false };
      },

      generateMath(expr, displayMode) {
        const delimiter = this._delimiters.find(d => displayMode === !!d[2]);
        if (!delimiter) {
          throw new Error(
            'Unable to find math delimiter with displayMode=' + displayMode
          );
        }

        return delimiter[0] + expr.trim() + delimiter[1];
      },

      data() {
        const math = this.data.math;
        const { displayMode } = this.parseMath(math);

        this.wrapper.setAttribute('data-math', math);
        this.wrapper.setAttribute('data-math-display-mode', displayMode);

        this.renderKatex();
      },

      upcast(el, data) {
        if (!(el.name === 'span' && el.hasClass(katexClass))) {
          return null;
        }

        if (el.children.length > 1
            || el.children[0].type !== CKEDITOR.NODE_TEXT) {
          return null;
        }

        const math = CKEDITOR.tools.htmlDecode(el.children[0].value);
        const { expr } = this.parseMath(math);
        if (!expr) {
          el.children[0].remove();
          return null;
        }

        data.math = math;
        return el;
      },

      downcast(el) {
        const content = CKEDITOR.tools.htmlEncode(this.data.math);
        el.children[0].replaceWith(new CKEDITOR.htmlParser.text(content));
        return el;
      }
    };

    return WidgetDefinition;
  }

  CKEDITOR.plugins.add('katex', {
    requires: 'widget,dialog',
    icons: 'katex',
    hidpi: true,

    onLoad() {
      CKEDITOR.dialog.add('katexEdit', this.path + 'dialogs/edit.js');

      CKEDITOR.addCss(`
        .cke_widget_katex[data-math-display-mode="true"] {
          display: block;
          text-align: center;
        }

        .cke_widget_katex > .cke_widget_element {
          display: inline-block;
          overflow: hidden;
          vertical-align: bottom;
        }

        .cke_widget_katex[data-math-display-mode="true"] > .cke_widget_element {
          display: block;
        }

        .cke_widget_katex .katex-error {
          font-size: 12px;
          color: #666 !important;
        }

        .cke_widget_katex .katex-error::before {
          content: attr(title);

          display: block;
          margin: 0 0 6px;
          padding: 0 0 3px;

          border-bottom: 1px dotted;
          color: #cc0000;
        }
      `);

      const isBlockBoundaryOrig = CKEDITOR.dom.element.prototype.isBlockBoundary;
      CKEDITOR.dom.element.prototype.isBlockBoundary = function() {
        const result = isBlockBoundaryOrig.apply(this, arguments);

        try {
          const isFalseBlock = result
              && this.getAscendant(x => x.data && x.data('widget') === 'katex');

          if (isFalseBlock) {
            return false;
          }
        } catch(e) {
          console.error(e);
        }

        return result;
      };
    },

    init(editor) {
      editor._.katex = { state: 'loading' };
      editor.widgets.add('katex', KatexWidgetDefinition(editor));
      this.loadLib(editor);
    },

    loadLib(editor) {
      // "addContentsCss" doesn't affect inline editor by design, and also it is
      // available only with the "wysiwygarea" plugin.
      // https://ckeditor.com/docs/ckeditor4/latest/guide/plugin_sdk_styles.html#inline-editor
      // https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#method-addContentsCss
      if (editor.elementMode === CKEDITOR.ELEMENT_MODE_INLINE) {
        this.attachLibCssToTheDocument(editor);
      } else if (editor.addContentsCss) {
        const katexLibCss = this.getLibCss(editor);
        editor.addContentsCss(katexLibCss);
      }

      if ('katex' in window) {
        editor._.katex.state = 'loaded';
      } else {
        const katexLibJs = this.getLibJs(editor);
        CKEDITOR.scriptLoader.load(katexLibJs, (success) => {
          editor._.katex.state = success ? 'loaded' : 'loaderror';

          const katexWidgets = Object.values(editor.widgets.instances)
              .filter(w => w.name === 'katex');
          katexWidgets.forEach(w => w.renderKatex());

          const activeDialog = CKEDITOR.dialog.getCurrent();
          if (activeDialog && activeDialog.getName() === 'katexEdit') {
            activeDialog.updatePreview();
          }
        });
      }
    },

    attachLibCssToTheDocument(editor, callback) {
      const katexLibCss = this.getLibCss(editor);
      const exists = !!document.head.querySelector(`link[href="${katexLibCss}"]`);
      if (!exists) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = katexLibCss;
        if (typeof callback === 'function') {
          link.onload = () => callback(true);
          link.onerror = () => callback(false);
        }

        document.head.appendChild(link);
      }
    },

    getLibCss(editor) {
      const path = editor.config.katexLibCss;
      if (!path) {
        throw new Error('ckeditor.config.katexLibCss must be defined');
      }

      return path;
    },

    getLibJs(editor) {
      const path = editor.config.katexLibJs;
      if (!path) {
        throw new Error('ckeditor.config.katexLibJs must be defined');
      }

      return path;
    }
  });
})();
