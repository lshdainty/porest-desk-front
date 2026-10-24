import { useState } from "react";
import type { IncludeExclude } from "../../model/filter";

/** 고르는 방식 — 고른 것만(포함) / 고른 것 빼고(제외) */
export type PickMode = "include" | "exclude";

/**
 * 카테고리 · 계좌 · 카드 본문의 공통 뼈대 — 맨 위 "고른 것만 · 고른 것 빼고" 하나 고르기(Chip outlineStrong) + 아래 여럿 고르기.
 * 칩은 두 상태뿐이다(chip.md "빼기 — 칩은 두 상태만", 3상태 칩 없음 — 2026-10-02 사용자 결정): 한 조건 안에서 넣기 · 빼기를
 * 섞지 않는다. "빼고" 로 바꾸면 고른 것이 `exclude` 로, "고른 것만" 이면 `include` 로 옮겨 간다(모델 `IncludeExclude` 는 그대로,
 * 한쪽만 채운다).
 */
export function useIncludeExclude(
  value: IncludeExclude,
  onChange: (next: IncludeExclude) => void,
) {
  // 처음 모드 — 빼는 쪽만 채워져 있으면 "빼고". 아무것도 안 골랐을 때 모드는 이 상태가 든다(값만으로는 알 수 없다)
  const [mode, setMode] = useState<PickMode>(
    value.exclude.length > 0 && value.include.length === 0
      ? "exclude"
      : "include",
  );
  const ids = mode === "exclude" ? value.exclude : value.include;
  const write = (next: number[], m: PickMode = mode) =>
    onChange(
      m === "exclude"
        ? { include: [], exclude: next }
        : { include: next, exclude: [] },
    );
  return {
    mode,
    ids,
    setIds: (next: number[]) => write(next),
    setMode: (m: PickMode) => {
      setMode(m);
      write(ids, m);
    },
    toggle: (id: number, on: boolean) =>
      write(
        on
          ? ids.includes(id)
            ? ids
            : [...ids, id]
          : ids.filter((x) => x !== id),
      ),
  };
}
