import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  ListChecks,
  Code,
  Code2,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { useEffect, useRef } from 'react'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onUpdate: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title?: string
}

const ToolbarButton = ({ onClick, isActive, children, title }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      'rounded p-1.5 transition-colors',
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
    {children}
  </button>
)

const ToolbarSeparator = () => (
  <div className="mx-0.5 h-5 w-px bg-border" />
)

export const RichTextEditor = ({
  content,
  onUpdate,
  placeholder,
  className,
  editable = true,
}: RichTextEditorProps) => {
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      onUpdate(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && !isInternalUpdate.current) {
      const currentHTML = editor.getHTML()
      if (content !== currentHTML) {
        editor.commands.setContent(content || '', { emitUpdate: false })
      }
    }
    isInternalUpdate.current = false
  }, [content, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  if (!editor) return null

  return (
    <div className={cn('rounded-md border', className)}>
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            <ListChecks size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo size={15} />
          </ToolbarButton>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none',
          '[&_.tiptap]:min-h-[200px] [&_.tiptap]:px-4 [&_.tiptap]:py-3 [&_.tiptap]:outline-none',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
          '[&_.tiptap_ul[data-type=taskList]]:list-none [&_.tiptap_ul[data-type=taskList]]:pl-0',
          '[&_.tiptap_ul[data-type=taskList]_li]:flex [&_.tiptap_ul[data-type=taskList]_li]:items-start [&_.tiptap_ul[data-type=taskList]_li]:gap-2',
          '[&_.tiptap_ul[data-type=taskList]_li_label]:mt-px',
          '[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-3',
          '[&_.tiptap_code]:rounded [&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:text-xs',
          '[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-primary/30 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-muted-foreground',
          '[&_.tiptap_mark]:bg-yellow-200 [&_.tiptap_mark]:dark:bg-yellow-800/50',
        )}
      />
    </div>
  )
}

interface RichTextViewerProps {
  content: string
  className?: string
}

export const RichTextViewer = ({ content, className }: RichTextViewerProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editable: false,
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <EditorContent
      editor={editor}
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        '[&_.tiptap]:outline-none',
        '[&_.tiptap_ul[data-type=taskList]]:list-none [&_.tiptap_ul[data-type=taskList]]:pl-0',
        '[&_.tiptap_ul[data-type=taskList]_li]:flex [&_.tiptap_ul[data-type=taskList]_li]:items-start [&_.tiptap_ul[data-type=taskList]_li]:gap-2',
        '[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-3',
        '[&_.tiptap_code]:rounded [&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:text-xs',
        '[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-primary/30 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-muted-foreground',
        '[&_.tiptap_mark]:bg-yellow-200 [&_.tiptap_mark]:dark:bg-yellow-800/50',
        className,
      )}
    />
  )
}
