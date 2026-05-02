import type { CSSProperties, ReactNode } from 'react'

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
  'hover:bg-[var(--pd-hover-bg)]'

export const MANAGE_ROW = {
  /** 행 컨테이너 className (기존 .cat-row + last/hover) */
  className: ROW_BASE_CLS,
  /** 아이콘 박스 style (기존 .cat-row__icon) */
  iconStyle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontWeight: 700,
    color: '#fff',
  } as CSSProperties,
  /** 텍스트 영역 style (기존 .cat-row__text) */
  textStyle: { flex: 1, minWidth: 0 } as CSSProperties,
  /** 라벨 style (기존 .cat-row__label) */
  labelStyle: {
    font: '600 14px/1.3 var(--font-sans)',
    color: 'var(--fg-primary)',
    letterSpacing: '-0.01em',
    marginBottom: 2,
  } as CSSProperties,
  /** 보조 메타 style (기존 .cat-row__meta) */
  metaStyle: {
    fontSize: 11.5,
    color: 'var(--fg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  } as CSSProperties,
  /** 액션 영역 className: 기본 opacity 0 → group-hover 시 1 */
  actionsClassName:
    'flex gap-1 opacity-0 transition-opacity duration-[var(--dur-fast,120ms)] group-hover:opacity-100',
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
   * 삭제 버튼에 적용 (기존 .cat-row__del:hover { color: var(--berry-700) }).
   * Button 컴포넌트의 hover bg/text 를 그대로 두기 위해 hover:!text-* 만 적용.
   */
  delClassName: 'hover:!text-[var(--berry-700)]',
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
