import type { ReactNode } from "react";

/**
 * 반반 액션 바 — 무게가 같은 액션 **둘**을 한 묶음으로 보여야 할 때
 * (내역 분할의 `항목 추가` · `균등 분할`). spec button.md Layout > Split bar.
 *
 * 본문 폭을 꽉 채운 **얇은 네모 바**를 반으로 갈라 각 칸에 `ghost` 버튼 하나씩 둔다.
 * 칸 사이는 1px 구분선이고, 모서리는 컨테이너가 깎으므로 버튼 쪽 radius 를 지운다.
 *
 * **얇게(sm 32) 둔다** — 목록에 줄을 더하는 성격이라 본문 행보다 무거우면 안 된다.
 * 화면의 주 액션은 footer 에 따로 있다.
 *
 * **pill 로 만들지 마라.** 선택 컨트롤(`ToggleGroup variant="segmented"`)과 갈리는 건
 * 눌린 상태가 없다는 점 하나뿐이라, 생김새까지 같아지면 단서가 사라진다.
 *
 * 셋 이상으로 나누지 않는다 — 그 이상은 그냥 나란히(gap 8) 두거나 DropdownMenu 로 접는다.
 */
export function SplitActions({ children }: { children: ReactNode }) {
  return (
    <div
      className={[
        "flex w-full overflow-hidden rounded-[var(--radius-md)]",
        "border border-border-default bg-[var(--bg-canvas)]",
        "[&>button]:flex-1 [&>button]:rounded-none",
        "[&>button+button]:border-l [&>button+button]:border-border-default",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
