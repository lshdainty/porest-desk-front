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
import { Toggle } from '@/shared/ui/toggle'
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
  <Toggle
    pressed={isActive}
    onPressedChange={() => onClick()}
    title={title}
    className={cn(
      'h-auto min-w-0 p-1.5 rounded gap-0',
      isActive
        ? 'bg-primary/10 text-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary'
        : 'text-text-secondary hover:bg-surface-input hover:text-text-primary'
    )}
  >
    {children}
  </Toggle>
)

const ToolbarSeparator = () => (
  <div className="mx-0.5 h-5 w-px bg-border-default" />
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
          '[&_.tiptap_p.is-editor-empty:first-child::before]:text-text-secondary/50',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
          '[&_.tiptap_ul[data-type=taskList]]:list-none [&_.tiptap_ul[data-type=taskList]]:pl-0',
          '[&_.tiptap_ul[data-type=taskList]_li]:flex [&_.tiptap_ul[data-type=taskList]_li]:items-start [&_.tiptap_ul[data-type=taskList]_li]:gap-2',
          '[&_.tiptap_ul[data-type=taskList]_li_label]:mt-px',
          // Tiptap task-list 의 native input → porest-design Checkbox spec 톤 (appearance:none + spec 토큰)
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:appearance-none',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:size-[18px]',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:shrink-0',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:rounded-sm',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:border',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:border-border-strong',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:bg-surface-default',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:cursor-pointer',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input]:transition-colors',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input:hover]:bg-surface-input',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-primary',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:border-primary',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-no-repeat',
          '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-center',
          "[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22white%22%20stroke-width=%223%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%2220%206%209%2017%204%2012%22/></svg>')]",
          '[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-surface-input [&_.tiptap_pre]:p-3',
          '[&_.tiptap_code]:rounded [&_.tiptap_code]:bg-surface-input [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:text-xs',
          '[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-primary/30 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-text-secondary',
          '[&_.tiptap_mark]:bg-[color-mix(in_srgb,var(--color-chart-yellow)_30%,transparent)] [&_.tiptap_mark]:dark:bg-[color-mix(in_srgb,var(--color-chart-yellow-light)_30%,transparent)]',
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
        // Tiptap task-list 의 native input → porest-design Checkbox spec 톤
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:appearance-none',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:size-[18px]',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:shrink-0',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:rounded-sm',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:border',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:border-border-strong',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input]:bg-surface-default',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-primary',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:border-primary',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-no-repeat',
        '[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-center',
        "[&_.tiptap_ul[data-type=taskList]_li_label_input:checked]:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22white%22%20stroke-width=%223%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%2220%206%209%2017%204%2012%22/></svg>')]",
        '[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-surface-input [&_.tiptap_pre]:p-3',
        '[&_.tiptap_code]:rounded [&_.tiptap_code]:bg-surface-input [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:text-xs',
        '[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-primary/30 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-text-secondary',
        '[&_.tiptap_mark]:bg-[color-mix(in_srgb,var(--color-chart-yellow)_30%,transparent)] [&_.tiptap_mark]:dark:bg-[color-mix(in_srgb,var(--color-chart-yellow-light)_30%,transparent)]',
        className,
      )}
    />
  )
}
