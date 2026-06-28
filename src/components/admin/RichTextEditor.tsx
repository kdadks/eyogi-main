// src/components/admin/RichTextEditor.tsx
import { useCallback, useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { ListNode, ListItemNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  EditorState,
  $createParagraphNode,
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode } from '@lexical/rich-text'
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'
import { cn } from '@/utilities/cn'

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const format = useCallback((fmt: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, fmt)
  }, [editor])

  const setHeading = useCallback((tag: 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag))
      }
    })
  }, [editor])

  const setParagraph = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }, [editor])

  const insertList = useCallback((ordered: boolean) => {
    editor.dispatchCommand(
      ordered ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
      undefined,
    )
  }, [editor])

  const btnCls = 'p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-700'

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50 flex-wrap">
      <button type="button" onClick={() => format('bold')} className={btnCls} title="Bold">
        <Bold className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => format('italic')} className={btnCls} title="Italic">
        <Italic className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => format('underline')} className={btnCls} title="Underline">
        <Underline className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-slate-300 mx-1" />
      <button type="button" onClick={setParagraph} className={cn(btnCls, 'text-xs font-medium px-2')}>P</button>
      <button type="button" onClick={() => setHeading('h2')} className={cn(btnCls, 'text-xs font-bold px-2')}>H2</button>
      <button type="button" onClick={() => setHeading('h3')} className={cn(btnCls, 'text-xs font-bold px-2')}>H3</button>
      <div className="w-px h-5 bg-slate-300 mx-1" />
      <button type="button" onClick={() => insertList(false)} className={btnCls} title="Bullet list">
        <List className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => insertList(true)} className={btnCls} title="Numbered list">
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  )
}

function InitPlugin({ value }: { value?: string }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    if (!value) return
    try {
      const state = editor.parseEditorState(value)
      editor.setEditorState(state)
    } catch {
      // value is not valid Lexical JSON — ignore (plain text case)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const editorConfig = {
  namespace: 'RichTextEditor',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  theme: {
    heading: { h2: 'text-2xl font-bold mb-2', h3: 'text-xl font-semibold mb-2' },
    text: { bold: 'font-bold', italic: 'italic', underline: 'underline' },
    list: {
      ul: 'list-disc list-inside mb-2',
      ol: 'list-decimal list-inside mb-2',
      listitem: 'ml-4',
    },
    paragraph: 'mb-2',
  },
  onError: (error: Error) => console.error('Lexical error:', error),
}

interface RichTextEditorProps {
  value?: string
  onChange?: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange?.(JSON.stringify(editorState.toJSON()))
    },
    [onChange],
  )

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="w-full p-4 min-h-[200px] focus:outline-none bg-white prose prose-sm max-w-none"
                aria-label="rich text editor"
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-slate-400 pointer-events-none select-none">
                {placeholder ?? 'Start writing…'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitPlugin value={value} />
      </div>
    </LexicalComposer>
  )
}
