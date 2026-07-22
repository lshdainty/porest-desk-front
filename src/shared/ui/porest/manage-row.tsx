import type { CSSProperties, ReactNode } from 'react'

import { MANAGE_ROW } from '@/shared/ui/porest/manage-row-tokens'

/**
 * ManageRow: 설정 화면(카테고리/계좌/예산 등) 좌측 행 레이아웃의 정렬·hover spec 보존.
 * 기존 .cat-row / .cat-row__icon / __text / __label / __meta / __actions / __more / __del 의
 * 시각 spec(폰트/패딩/구분선/hover bg/actions opacity 트랜지션 등)을 그대로 옮김.
 *
 * - hover bg: --pd-hover-bg (기존 .cat-row:hover 동일)
 * - actions: 기본 opacity 0, group-hover 시 opacity 1 (기존 .cat-row:hover .cat-row__actions)
 * - 마지막 행 border 제거: last-child 셀렉터 - last:border-b-0
 */


export function ManageRow({
  className = '',
  style,
  onClick,
  children,
}: {
  className?: string
  style?: CSSProperties
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  children: ReactNode
}) {
  return (
    <div
      className={`${MANAGE_ROW.className} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
