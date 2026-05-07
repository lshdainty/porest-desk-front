import { Search } from 'lucide-react'

/**
 * 검색 페이지 — 단계적 구현 (TODO: 키워드/카테고리/금액/날짜 통합 검색).
 * 현재는 placeholder. Flutter SearchScreen 미러는 v0.7 에서.
 */
export function SearchPage() {
  return (
    <div className="m-scroll" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--fg-tertiary)' }}>
      <Search size={32} strokeWidth={1.5} />
      <div style={{ fontSize: 14, fontWeight: 500 }}>검색 기능 준비 중</div>
      <div style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>v0.7 에 추가 예정</div>
    </div>
  )
}
