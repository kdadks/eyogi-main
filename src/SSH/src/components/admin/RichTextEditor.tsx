import React from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import '../styles/quill-preview.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
}

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'code-block',
  'list',
  'bullet',
  'indent',
  'link',
]

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
}: RichTextEditorProps) {
  return (
    <div className="space-y-2">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
        style={{
          border: '1px solid rgb(209, 213, 219)',
          borderRadius: '0.5rem',
        }}
      />
      {value && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Preview:</p>
          <div
            className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 ql-editor ql-blank=false"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
    </div>
  )
}
