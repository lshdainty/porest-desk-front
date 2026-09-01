import { useEffect, useRef, useState } from "react";

/*
 * 원장 스크롤 훅 — 컴포넌트 파일(`ledger.tsx`)과 갈라 둔다.
 * 한 파일이 컴포넌트와 그 밖의 것을 함께 export 하면 Fast Refresh 가 그 파일의 상태를
 * 매번 버린다(react-refresh/only-export-components).
 */

const COMPACT_ENTER = 72;
const COMPACT_EXIT = 24;

/**
 * pin compact(72/24 히스테리시스 + 짧은 콘텐츠 플리커 가드) · 스크롤 스파이
 * ([data-ledger-day] 그룹 → 선택 동기) · lock/scrollToDay 공용 훅.
 */
export function useLedgerScroll({
  pinTop = 0,
  initialSelected = null,
  onCompactEnter,
}: {
  /** 상단 고정 헤더 높이(px) — sticky top·스크롤 보정 offset. */
  pinTop?: number;
  initialSelected?: string | null;
  /** compact 진입 순간 콜백 (예: 캘린더 월 전체 → 주 1줄 접기). */
  onCompactEnter?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const selectedRef = useRef<string | null>(initialSelected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const lockRef = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lock = (ms: number) => {
    lockRef.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      lockRef.current = false;
    }, ms);
  };

  // 스크롤 핸들러가 항상 최신 콜백을 부르게 담아 둔다. 쓰기는 커밋 뒤에 한다 —
  // 렌더 중에 ref 를 쓰면 화면과 어긋난 값을 남길 수 있다(`react-hooks/refs`).
  // 핸들러는 커밋 이후에만 도므로 한 렌더 늦을 일이 없다.
  const onCompactEnterRef = useRef(onCompactEnter);
  useEffect(() => {
    onCompactEnterRef.current = onCompactEnter;
  });

  const scroller = () =>
    rootRef.current?.closest(
      ".m-scroll, .overflow-y-auto",
    ) as HTMLElement | null;

  useEffect(() => {
    const p = scroller();
    if (!p) return;
    const onScroll = () => {
      const st = p.scrollTop;
      setCompact((prev) => {
        // 콘텐츠가 짧으면 접힘(−collapse 높이) 순간 scrollTop이 해제 임계 아래로
        // clamp돼 접힘↔펼침 무한 플리커 발생 — 접힌 뒤에도 진입 임계 위에
        // 남을 수 있는 스크롤 여유가 있을 때만 진입.
        const collapseH =
          pinRef.current?.querySelector("[data-ledger-collapse]")
            ?.scrollHeight ?? 0;
        const canStay =
          p.scrollHeight - p.clientHeight - (prev ? 0 : collapseH) >
          COMPACT_ENTER;
        const next = prev ? st > COMPACT_EXIT : st > COMPACT_ENTER && canStay;
        if (next && !prev) onCompactEnterRef.current?.();
        return next;
      });
      if (lockRef.current || !pinRef.current || !rootRef.current) return;
      const bottom = pinRef.current.getBoundingClientRect().bottom;
      const groups = rootRef.current.querySelectorAll("[data-ledger-day]");
      if (!groups.length) return;
      let cur = groups[0]!.getAttribute("data-ledger-day");
      for (const g of groups) {
        if (g.getBoundingClientRect().top <= bottom + 28)
          cur = g.getAttribute("data-ledger-day");
        else break;
      }
      if (cur && selectedRef.current !== cur) {
        selectedRef.current = cur;
        setSelected(cur);
      }
    };
    p.addEventListener("scroll", onScroll, { passive: true });
    return () => p.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToDay = (ds: string) => {
    const el = rootRef.current?.querySelector(`[data-ledger-day="${ds}"]`);
    const p = scroller();
    if (!el || !p) return;
    const pinH = (pinRef.current?.offsetHeight ?? 0) + pinTop;
    p.scrollTo({
      top:
        p.scrollTop +
        el.getBoundingClientRect().top -
        p.getBoundingClientRect().top -
        pinH -
        6,
      behavior: "smooth",
    });
  };
  const scrollToTop = () =>
    scroller()?.scrollTo({ top: 0, behavior: "smooth" });

  return {
    rootRef,
    pinRef,
    compact,
    selected,
    setSelected,
    lock,
    scrollToDay,
    scrollToTop,
  };
}

// ─── 큰 틀 ──────────────────────────────────────────────────

/** 페이지 루트 — 좌우 spacing-xl(24) 인셋 담당, 하단 28. */
