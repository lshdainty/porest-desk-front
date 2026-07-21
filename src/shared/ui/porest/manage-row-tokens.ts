import type { CSSProperties } from 'react'

import { tileRadius } from '@/shared/lib'

/*
 * MANAGE_ROW 스타일 토큰 — manage-row.tsx 에서 분리(Fast Refresh: 컴포넌트 파일은
 * 컴포넌트만 export). 시각 spec 주석은 manage-row.tsx 상단 참조.
 */
const ROW_BASE_CLS =
  'group flex items-center gap-3 ' +
  'px-2 py-3 ' +
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
