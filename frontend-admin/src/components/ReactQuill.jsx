import { useState, useRef, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import { Controller } from 'react-hook-form';
import 'react-quill-new/dist/quill.snow.css';

const RichTextEditor = ({
  // React Hook Form props
  name,
  control,
  errors = {},

  // Component props
  value = null,
  onChange: propOnChange = () => { },
  placeholder = 'Start writing...',
  readOnly = false,
  theme = 'snow',
  height = '300px',
  required = false,
  labelName = 'Rich Text Editor',
  defaultValue = null,

  // Toolbar customization
  toolbar = 'full',
  ...rest
}) => {
  const quillRef = useRef(null);

  // Initialize with empty delta if no value provided
  const [editorValue, setEditorValue] = useState(value || defaultValue || {
    ops: [
      { insert: '\n' }
    ]
  });

  // Toolbar configurations
  const toolbarConfigs = {
    full: [
      // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    basic: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    minimal: [
      ['bold', 'italic'],
      [{ 'list': 'bullet' }],
      ['clean']
    ]
  };

  const modules = {
    toolbar: {
      container: toolbarConfigs[toolbar] || toolbarConfigs.full,
      handlers: {
        align: (value) => {
          const quill = quillRef.current?.getEditor?.();
          if (!quill) return;
          const sel = quill.getSelection(true);
          if (!sel) return;
          const alignValue = value || '';
          // Apply to all lines in selection (Ctrl+A friendly)
          const end = sel.index + sel.length;
          let i = sel.index;
          try {
            while (i <= end) {
              quill.formatLine(i, 1, { align: alignValue });
              const res = quill.getLine(i);
              const line = res && res[0];
              const len = line && line.length ? line.length() : 0;
              if (len === 0) {
                // empty line, move forward by 1
                i += 1;
              } else {
                // move to next line (+1 for newline)
                i += len + 1;
              }
              if (i <= sel.index) break;
            }
          } catch {
            // fallback: single line
            quill.formatLine(sel.index, sel.length, { align: alignValue });
          }
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  // Handle editor change for standalone usage
  const handleChange = useCallback((content, delta, source, editor) => {
    if (source === 'user') {
      const contents = editor.getContents(); // Get Delta format
      setEditorValue(contents);
      propOnChange(contents);
    }
  }, [propOnChange]);

  // Get nested error message
  const getNestedError = (errorObj, path) => {
    if (!errorObj || !path) return null;

    const keys = path.split('.');
    let result = errorObj;

    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return null;
      }
    }

    return result;
  };

  const error = getNestedError(errors, name)?.message;

  // Common editor styles
  const editorStyles = {
    // height: `calc(${height} - 42px)`,
    borderRadius: '8px'
  };

  // Common container classes
  const containerClasses = `
    w-full flex flex-col gap-1 mb-10
    [&_.ql-toolbar]:rounded-t-lg
    [&_.ql-container]:rounded-b-lg
    [&_.ql-toolbar]:border-gray-300
    [&_.ql-container]:border-gray-300
    [&_.ql-toolbar.ql-snow]:border
    [&_.ql-container.ql-snow]:border
    [&_.ql-toolbar.ql-snow]:border-b-0
    [&_.ql-toolbar]:bg-gray-50
  `;

  // Auto-center newly inserted images and allow alignment via toolbar
  useEffect(() => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;

    try {
      quill.clipboard.addMatcher('IMG', (node, delta) => {
        // Ensure a centered line after the image embed
        if (delta && Array.isArray(delta.ops)) {
          // Only add centered newline if not already present
          const hasNewlineAfter =
            delta.ops.length > 1 &&
            typeof delta.ops[delta.ops.length - 1]?.insert === 'string' &&
            delta.ops[delta.ops.length - 1]?.insert.includes('\n');
          if (!hasNewlineAfter) {
            delta.ops.push({ insert: '\n', attributes: { align: 'center' } });
          } else {
            // force center on the newline after image
            const last = delta.ops[delta.ops.length - 1];
            last.attributes = { ...(last.attributes || {}), align: 'center' };
          }
        }
        return delta;
      });
    } catch {}

    const handleTextChange = () => {
      // On any change, ensure all image lines are centered if not explicitly aligned
      try {
        const contents = quill.getContents();
        let idx = 0;
        contents.ops?.forEach((op) => {
          const isImage = op.insert && op.insert.image;
          const len =
            op.insert && typeof op.insert === 'string'
              ? op.insert.length
              : isImage
              ? 1
              : 0;
          if (isImage) {
            quill.formatLine(idx, 1, { align: 'center' });
          }
          idx += len;
        });
      } catch {}
    };

    quill.on('text-change', handleTextChange);
    return () => {
      quill.off('text-change', handleTextChange);
    };
  }, []);

  // Fallback: on initial load, center any images that have no alignment
  useEffect(() => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    try {
      const contents = quill.getContents();
      let idx = 0;
      contents.ops?.forEach((op) => {
        const len =
          op.insert && typeof op.insert === 'string'
            ? op.insert.length
            : op.insert && op.insert.image
            ? 1
            : 0;
        if (op.insert && op.insert.image) {
          // Attempt to center the image line
          quill.formatLine(idx, 1, { align: 'center' });
        }
        idx += len;
      });
    } catch {}
  }, []);

  return (
    <div className={containerClasses}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-900"
      >
        {labelName}
        {required && <span className="text-red-600"> *</span>}
      </label>

      {control ? (
        // ✅ Controlled RHF mode using `Controller`
        <Controller
          name={name}
          control={control}
          defaultValue={defaultValue || {
            ops: [
              { insert: '\n' }
            ]
          }}
          render={({ field }) => (
            <ReactQuill
              ref={quillRef}
              theme={theme}
              value={field.value}
              onChange={(content, delta, source, editor) => {
                if (source === 'user') {
                  const contents = editor.getContents();
                  field.onChange(contents);
                  propOnChange(contents);
                }
              }}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              readOnly={readOnly}
              style={editorStyles}
              {...rest}
            />
          )}
        />
      ) : (
        // ✅ Standalone controlled version
        <ReactQuill
          ref={quillRef}
          theme={theme}
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={editorStyles}
          {...rest}
        />
      )}

      {error && (
        <p className="text-xs text-red-600 text-start ml-1 mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor;
