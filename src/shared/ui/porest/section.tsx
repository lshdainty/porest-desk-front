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
          {action}
        </div>
        <div>{children}</div>
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
