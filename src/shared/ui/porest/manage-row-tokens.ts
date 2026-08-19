import type { CSSProperties } from 'react'

import { tileRadius } from '@/shared/lib'

/*
 * MANAGE_ROW 스타일 토큰 — manage-row.tsx 에서 분리(Fast Refresh: 컴포넌트 파일은
 * 컴포넌트만 export). 시각 spec 주석은 manage-row.tsx 상단 참조.
 */
// 좌우 inset 은 디바이스별로 다르다.
//
// 모바일은 0 — 페이지(설정 본문 래퍼)가 좌우 24 를 한 번만 쥐고, 섹션 제목도 행도
// 거기서 바로 시작한다. 행이 여기서 8 을 더 얹으면 제목만 24 에 서고 행은 32 로 밀려
// 두 줄이 어긋나 보인다. 카드 다이어트라 행에 배경이 없어 inset 이 할 일이 없다.
//
// 데스크톱/태블릿은 카드(.cat-list) 내부라 카드 여백(20)이 필요하다. 한쪽 값이 다른
// 쪽에 새면 카드 안 행이 끝에 붙거나(데스크톱) 과하게 들여쓰인다(모바일).
const ROW_BASE_CLS =
  'group flex items-center gap-3 ' +
  'py-3 ' +
  'border-b border-solid border-[var(--border-subtle)] ' +
  'last:border-b-0 ' +
  'hover:bg-[var(--bg-muted)]'

/** 디바이스별 행 className — 호출부의 `mobile` 판정을 그대로 넘긴다. */
export const manageRowClass = (mobile?: boolean) =>
  `${ROW_BASE_CLS} ${mobile ? 'px-0' : 'px-5'}`

export const MANAGE_ROW = {
  /** 행 컨테이너 className — 모바일 기준(px-0). 데스크톱은 manageRowClass(false) 사용. */
  className: `${ROW_BASE_CLS} px-0`,
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

/**
 * 설정 리스트 행의 좌우 inset — 인라인 style 로 행을 그리는 화면(캘린더 공유·라벨·할일 태그)용.
 * 모바일은 0(페이지가 24 를 쥔다), 데스크톱/태블릿은 카드 내부 여백이 필요. manageRowClass 와 같은 규칙.
 */
export const settingsRowPadding = (mobile?: boolean) =>
  (mobile ? '14px 0' : '15px 20px')
