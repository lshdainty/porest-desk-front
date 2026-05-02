import type { CSSProperties } from 'react'

/**
 * tx-row CSS spec 토큰. (기존 .tx-row / __meta / __title / __sub / __sub .sep / __amt 보존.)
 *
 * - 외곽: 4px 가로 패딩 + -4px 마진으로 카드 안쪽 폭에 맞춤.
 * - hover: --pd-hover-bg (Tailwind hover arbitrary value).
 * - amt: 양수(income) 시 mossy-700, 음수(지출) 시 berry-700.
 */

const TX_ROW_CLS =
  'flex items-center gap-3 cursor-pointer rounded-lg ' +
  'pl-1 pr-1 -ml-1 -mr-1 ' +
  'py-[var(--row-py,12px)] ' +
  'transition-[background] duration-[var(--dur-fast)] ' +
  'hover:bg-[var(--pd-hover-bg)]'

const TX_ROW_TITLE_STYLE: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--fg-primary)',
  letterSpacing: '-0.005em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const TX_ROW_SUB_STYLE: CSSProperties = {
  fontSize: 12,
  color: 'var(--fg-tertiary)',
  marginTop: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const TX_ROW_SEP_STYLE: CSSProperties = {
  width: 2,
  height: 2,
  borderRadius: 999,
  background: 'var(--pd-dot)',
}

const txRowAmtStyle = (income: boolean): CSSProperties => ({
  fontSize: 14,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
  color: income ? 'var(--mossy-700)' : 'var(--berry-700)',
  textAlign: 'right',
  flexShrink: 0,
})

export const TX_ROW = {
  className: TX_ROW_CLS,
  metaStyle: { flex: 1, minWidth: 0 } as CSSProperties,
  titleStyle: TX_ROW_TITLE_STYLE,
  subStyle: TX_ROW_SUB_STYLE,
  sepStyle: TX_ROW_SEP_STYLE,
  amtStyle: txRowAmtStyle,
} as const
