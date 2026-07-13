import type { CSSProperties, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

/**
 * Section — 리스트형 화면의 공통 껍데기 (design primitives.jsx `Section` SoT 미러).
 *
 * 모바일 = 카드 다이어트: 카드 없이 flat-group 헤드(라벨 + 합계/액션) + 리스트.
 *   섹션 간 간격은 부모 컨테이너의 flex gap 이 담당 (margin 금지 — 중복 시 간격 어긋남).
 * 데스크톱 = 기존 Card(shadow) + CardHeader/CardContent.
 */
export function Section({
  mobile,
  title,
  total,
  totalColor,
  action,
  children,
  cardStyle,
  contentInset,
}: {
  mobile: boolean
  title: ReactNode
  /** 우측 합계 표기 (예: 잔액 합) — null/undefined 면 숨김 */
  total?: ReactNode
  totalColor?: string
  /** 우측 액션 노드 (예: <button className="all">…) — total 과 동시 사용 가능 */
  action?: ReactNode
  children: ReactNode
  cardStyle?: CSSProperties
  /**
   * 모바일에서 content 를 좌우로 살짝 들여쓴다 (label 은 page padding edge 0, content 는 안쪽).
   * 자산 `.acc-card`(padding 10 − margin 2 = net 8) 리듬을 자체 행 padding 이 없는 섹션
   * (통계 도넛/범례/차트 등)에 부여할 때 사용. label(flat-group__head)은 그대로 0 유지.
   */
  contentInset?: boolean
}) {
  if (mobile) {
    return (
      <section>
        <div className="flat-group__head">
          <h2>{title}</h2>
          {total != null && (
            <span className="flat-group__total num" style={totalColor ? { color: totalColor } : undefined}>
              {total}
            </span>
          )}
          {action != null && (
            // total 이 없으면 action 이 우측 정렬을 담당 (.all 버튼은 자체 margin-left:auto).
            <span style={{ marginLeft: total == null ? 'auto' : undefined, display: 'inline-flex', alignItems: 'center' }}>
              {action}
            </span>
          )}
        </div>
        <div style={contentInset ? { paddingLeft: 'var(--spacing-sm)', paddingRight: 'var(--spacing-sm)' } : undefined}>
          {children}
        </div>
      </section>
    )
  }
  return (
    <Card style={cardStyle}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
        </CardTitle>
        {total != null && (
          <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: 700, color: totalColor }}>
            {total}
          </span>
        )}
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
