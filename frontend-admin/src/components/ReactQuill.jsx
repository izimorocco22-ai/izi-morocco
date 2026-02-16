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
          quill.formatLine(sel.index, sel.length, { align: alignValue });
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

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      const hasImage = delta.ops?.some((op) => op.insert && op.insert.image);
      if (hasImage) {
        // After Quill updates selection, align the image's line to center
        setTimeout(() => {
          try {
            const sel = quill.getSelection(true);
            if (sel && sel.index > 0) {
              const idx = sel.index - 1; // image embed sits at index - 1
              quill.formatLine(idx, 1, { align: 'center' });
            }
          } catch {}
        }, 0);
      }
    };

    quill.on('text-change', handleTextChange);
    return () => {
      quill.off('text-change', handleTextChange);
    };
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
