import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ProgressCircle } from "@/shared/ds/progress-circle";
import { useWaitPhase } from "@/shared/ds/skeleton";

/**
 * BusyOverlay — 뒤를 만지면 안 되는 처리 동안 화면 전체를 덮는다(I-05 37 · 49, progress-circle.md "뒤를 만지면 안 되는 처리").
 *
 * 딤(`overlay-dim-light` 50% · `overlay-dim-dark` 65%) + 흰 원 40(`staticWhite`, 값 없음).
 * 켜자마자 뒤는 눌리지 않고(투명 막), **1초가 지나야** 딤과 원이 보인다(빨리 끝나면 번쩍이지 않게).
 * 딤 위에 안내 글은 두지 않는다(글자색 짝이 스펙에 없다 — 열린 일).
 * 보이는 동안 뒤 화면(열린 시트 포함)은 보조 기술에서 숨긴다 — `body` 의 다른 자식에 `aria-hidden` 을 달고
 * 걷을 때 원래 값으로 되돌린다. 원은 `label` 이름의 progressbar 다.
 */
export function BusyOverlay({
  busy,
  label,
}: {
  busy: boolean;
  /** 원 이름 — "해지하는 중" · "가져오는 중" */
  label: string;
}) {
  const phase = useWaitPhase(busy);
  const visible = busy && phase !== "quiet";

  useEffect(() => {
    if (!visible) return;
    const hidden: Array<[Element, string | null]> = [];
    for (const el of Array.from(document.body.children)) {
      if (el.hasAttribute("data-busy-overlay")) continue;
      hidden.push([el, el.getAttribute("aria-hidden")]);
      el.setAttribute("aria-hidden", "true");
    }
    return () => {
      for (const [el, prev] of hidden) {
        if (prev === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", prev);
      }
    };
  }, [visible]);

  if (!busy) return null;
  return createPortal(
    <div
      data-busy-overlay=""
      data-slot="busy-overlay"
      data-visible={visible || undefined}
      className={
        visible
          ? "fixed inset-0 z-(--z-alert) flex items-center justify-center bg-[var(--overlay-dim-light)] dark:bg-[var(--overlay-dim-dark)]"
          : "fixed inset-0 z-(--z-alert)"
      }
    >
      {visible && (
        <ProgressCircle size="40" tone="staticWhite" aria-label={label} />
      )}
    </div>,
    document.body,
  );
}
