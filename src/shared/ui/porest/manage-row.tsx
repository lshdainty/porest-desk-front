import type { CSSProperties, ReactNode } from 'react'

import { tileRadius } from '@/shared/lib'

/**
 * ManageRow: 설정 화면(카테고리/계좌/예산 등) 좌측 행 레이아웃의 정렬·hover spec 보존.
 * 기존 .cat-row / .cat-row__icon / __text / __label / __meta / __actions / __more / __del 의
 * 시각 spec(폰트/패딩/구분선/hover bg/actions opacity 트랜지션 등)을 그대로 옮김.
 *
 * - hover bg: --pd-hover-bg (기존 .cat-row:hover 동일)
 * - actions: 기본 opacity 0, group-hover 시 opacity 1 (기존 .cat-row:hover .cat-row__actions)
 * - 마지막 행 border 제거: last-child 셀렉터 - last:border-b-0
 */

const ROW_BASE_CLS =
  'group flex items-center gap-3 ' +
  'px-4 py-3 ' +
  'border-b border-solid border-[var(--border-subtle)] ' +
  'last:border-b-0 ' +
  'hover:bg-[var(--bg-muted)]'

export const MANAGE_ROW = {
  /** 행 컨테이너 className (기존 .cat-row + last/hover) */
  className: ROW_BASE_CLS,
  /** 아이콘 박스 style (기존 .cat-row__icon) */
  iconStyle: {
    width: 36,
    height: 36,
    borderRadius: tileRadius(36),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontWeight: '700',
    color: 'var(--fg-on-brand)',
  } as CSSProperties,
  /** 텍스트 영역 style (기존 .cat-row__text) */
  textStyle: { flex: 1, minWidth: 0 } as CSSProperties,
  /** 라벨 style (기존 .cat-row__label) */
  labelStyle: {
    font: '600 14px/1.3 var(--font-sans)',
    color: 'var(--fg-primary)',
    letterSpacing: '-0.012em',
    marginBottom: 2,
  } as CSSProperties,
  /** 보조 메타 style (기존 .cat-row__meta) */
  metaStyle: {
    fontSize: 'var(--text-caption)',
    color: 'var(--fg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  } as CSSProperties,
  /** 액션 영역 className: 아이콘 항상 표시 (hover-reveal 제거, 반복거래관리와 일관). */
  actionsClassName: 'flex gap-1',
  /** 모바일용 chevron 버튼 style (기존 .cat-row__more) */
  moreStyle: {
    border: 0,
    background: 'transparent',
    color: 'var(--fg-tertiary)',
    cursor: 'pointer',
    padding: 4,
    display: 'inline-flex',
  } as CSSProperties,
  /**
   * 삭제 버튼에 적용 — 항상 빨강(--fg-expense). 반복/프리셋 관리의 삭제 버튼과 색 통일.
   * ghost variant 의 hover 는 bg 만 바꾸므로 text 는 항상 expense 로 고정.
   */
  delClassName: '!text-[var(--fg-expense)]',
} as const

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
      className={`${ROW_BASE_CLS} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
