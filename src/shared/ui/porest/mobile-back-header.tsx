import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'

/**
 * 모바일 풀스크린 페이지 헤더 — 앱 AppBar 미러.
 * ← 뒤로(ghost icon) + 타이틀(title-md 18/600), surface bg, sticky.
 * AppLayout FULLSCREEN_PATHS 페이지(메모·할일 등)에서 사용 —
 * 뒤로가기는 기본 '전체'(/desk/more) — 앱에서 전체 탭 → push 동선과 동일.
 */
export function MobileBackHeader({
  title,
  to = '/desk/more',
}: {
  title: string
  to?: string
}) {
  const navigate = useNavigate()
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 12px',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      <Button variant="ghost" size="icon" aria-label="뒤로" onClick={() => navigate(to)}>
        <ArrowLeft size={20} />
      </Button>
      <h1
        style={{
          fontSize: 'var(--text-title-md)',
          fontWeight: 600,
          color: 'var(--fg-primary)',
          margin: 0,
        }}
      >
        {title}
      </h1>
    </div>
  )
}
