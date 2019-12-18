'use strict';

(function() {
  CKEDITOR.dialog.add('katexEdit', function(editor) {
    const DialogDefinition = {
      title: 'Math',
      minWidth: 350,
      minHeight: 100,
      resizable: CKEDITOR.DIALOG_RESIZE_NONE,

      onLoad() {
        // Required for preview. Unfortunately, @font-face within shadow dom
        // doesn't work. https://bugs.chromium.org/p/chromium/issues/detail?id=336876
        const plugin = CKEDITOR.plugins.registered.katex;
        plugin.attachLibCssToTheDocument(editor);

        this.getMath = this.definition.getMath.bind(this);
        this.updatePreview = this.definition.updatePreview.bind(this);
      },

      getMath(widget) {
        const expr = this.getValueOf('main', 'expr');
        const displayModeOption = this.getValueOf('main', 'displayMode');
        const displayMode = (displayModeOption === 'true');
        const math = widget.generateMath(expr, displayMode);
        return math;
      },

      updatePreview() {
        const preview = this.getContentElement('main', 'preview');
        preview.updatePreview();
      },

      contents: [{
        id: 'main',
        elements: [{
          id: 'expr',
          type: 'textarea',
          label: 'Write TeX here',
          required: true,
					validate: CKEDITOR.dialog.validate.notEmpty(
            'Please enter the math expression.'
          ),

          onLoad() {
            const area = this.getInputElement();
            const dialog = this.getDialog();

            area.on('input', () => {
              dialog.updatePreview();
            });

            area.$.spellcheck = false;
          },

          setup(widget) {
            const { expr } = widget.parseMath(widget.data.math);
            this.setValue(expr);
          },

          commit(widget) {
            const math = this.getDialog().getMath(widget);
            widget.setData('math', math);
          }
        }, {
          id: 'displayMode',
          type: 'radio',
          items: [['Inline', 'false'], ['Display mode', 'true']],
          label: '',
          labelLayout: 'horizontal',
          widths: [0, 100],

          onChange() {
            const prevValue = this.getInitValue();
            if (!prevValue) {
              // Ignore first call when dialog is opening
              // (init value == 'default' option).
              return;
            }

            this.getDialog().updatePreview();
          },

          setup(widget) {
            const { displayMode } = widget.parseMath(widget.data.math);
            this.setValue(displayMode.toString());
          },

          commit(widget) {
            const math = this.getDialog().getMath(widget);
            widget.setData('math', math);
          }
        }, {
          id: 'doc',
          type: 'html',
          html: `
            <div style="width: 100%; text-align: right; margin: -8px 0 10px;">
              <a
                href="http://en.wikibooks.org/wiki/LaTeX/Mathematics"
                target="_blank"
                rel="noopener noreferrer"
                style="cursor:pointer;text-decoration:underline;"
               >
                TeX documentation
              </a>
            </div>
          `
        }, {
          id: 'preview',
          type: 'html',
          html: `
            <style>
              .cke_dialog cke-katex-preview {
                display: flex;
                align-items: center;
                justify-content: center;

                min-height: 2em;
                max-width: 90vw;
                overflow-x: auto;
                overflow-y: hidden;

                white-space: normal;
                font-size: 16px;
              }
            </style>

            <cke-katex-preview editor="${editor.name}"></cke-katex-preview>
          `,

          onLoad() {
            const el = this.getElement();
            const katexPreview = el.findOne('cke-katex-preview');

            if ('customElements' in window) {
              if (!customElements.get('cke-katex-preview')) {
                customElements.define('cke-katex-preview', CKEKatexPreview);
              }
            } else {
              el.setAttribute('hidden', '');
            }

            this._katexPreview = katexPreview;
          },

          setup(widget) {
            this._widget = widget;
            this._katexPreview.setAttribute('widget', widget.id);
            this._katexPreview.setAttribute('math', widget.data.math);
          },

          updatePreview() {
            const widget = this._widget;
            const katexPreview = this._katexPreview;
            if (widget && katexPreview) {
              const math = this.getDialog().getMath(widget);
              katexPreview.setAttribute('math', math);
            }
          }
        }]
      }]
    };

    return DialogDefinition;
  });

  class CKEKatexPreview extends HTMLElement {
    constructor() {
      super();

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
          }

          .container[data-loading] {
            display: none;
          }

          .katex-error {
            font-size: 12px;
            color: #666 !important;
          }

          .katex-error::before {
            content: attr(title);

            display: block;
            margin: 0 0 6px;
            padding: 0 0 3px;

            border-bottom: 1px dotted;
            color: #cc0000;
          }
        </style>
        <div class="container" data-loading></div>
      `;

      const editorId = this.getAttribute('editor');
      const editor = editorId && CKEDITOR.instances[editorId];
      if (!editor) {
        throw new Error('editor must be defined');
      }

      const plugin = CKEDITOR.plugins.registered.katex;
      if (!plugin) {
        throw new Error('katex plugin must be registered');
      }

      this._editor = editor;
      this._widget = null;
      this._container = this.shadowRoot.querySelector('.container');

      const onLoaded = () => {
        delete this._container.dataset.loading;
      };

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = plugin.getLibCss(editor);
      link.onload = onLoaded;
      link.onerror = onLoaded;
      this.shadowRoot.appendChild(link);
    }

    static get observedAttributes() {
      return ['math', 'widget'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'widget') {
        const widgetId = newValue;
        this._widget = this._editor.widgets.instances[widgetId];
      } else if (name === 'math') {
        this._renderKatex(newValue);
      }
    }

    _renderKatex(math) {
      const widget = this._widget;
      const html = math && widget ? widget.renderKatexHtml(math) : '';
      this._container.innerHTML = html;
    }
  }
})();
