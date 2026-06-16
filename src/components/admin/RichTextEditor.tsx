'use client'

/**
 * Lexical Rich Text Editor
 */

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value?: string
  onChange?: (content: string) => void
  placeholder?: string
}

const editorConfig = {
  namespace: 'RichTextEditor',
  theme: {
    paragraph: 'mb-4',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
    },
  },
  onError: (error: Error) => {
    console.error('Editor error:', error)
  },
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className="w-full p-4 min-h-[300px] focus:outline-none bg-white"
              placeholder={placeholder}
              aria-label="editor"
            />
          }
          placeholder={<div className="p-4 text-slate-400 pointer-events-none">{placeholder}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  )
}
