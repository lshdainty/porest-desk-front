import ReactMarkdown from 'react-markdown'

interface MemoPreviewProps {
  content: string
}

export const MemoPreview = ({ content }: MemoPreviewProps) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
