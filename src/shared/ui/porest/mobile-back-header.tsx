import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/**
 * 모바일 풀스크린 페이지 헤더 — 앱 AppBar 미러.
 * ← 뒤로(ghost icon) + 타이틀(title-md 18/600) + 우측 액션(trailing, 선택), surface bg, sticky.
 * AppLayout FULLSCREEN_PATHS 페이지(메모·할일 등)에서 사용 —
 * 뒤로가기는 기본 '전체'(/desk/more) — 앱에서 전체 탭 → push 동선과 동일.
 */
export function MobileBackHeader({
  title,
  to = '/desk/more',
  trailing,
}: {
  title: string
  to?: string
  /** 헤더 우측 끝 액션 슬롯(앱 AppBar actions 미러). 미지정 시 기존과 동일. */
  trailing?: ReactNode
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
        padding: '12px 8px',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate(to)}
        style={{
          border: 0,
          background: 'transparent',
          padding: 6,
          display: 'inline-flex',
          cursor: 'pointer',
          color: 'var(--fg-primary)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <ChevronLeft size={22} />
      </button>
      <h1
        style={{
          flex: 1,
          fontSize: 'var(--text-title-md)',
          fontWeight: 600,
          letterSpacing: '-0.012em',
          color: 'var(--fg-primary)',
          margin: 0,
        }}
      >
        {title}
      </h1>
      {trailing && <div style={{ display: 'flex', alignItems: 'center' }}>{trailing}</div>}
    </div>
  )
}
