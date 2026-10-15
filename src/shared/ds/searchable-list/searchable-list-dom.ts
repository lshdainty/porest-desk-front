/*
 * Searchable List 의 DOM 도우미 — 결과 줄 찾기 · 스크롤. 줄은 초점을 받지 않아(초점은 늘 검색칸) 화살표 · 열기가
 * 줄의 자리를 직접 읽어 스크롤한다.
 */

// 결과 줄 — 문서 순서대로(분류 머리는 줄이 아니라 건너뛴다)
export function optionsOf(listbox: HTMLElement | null) {
  return listbox
    ? Array.from(
        listbox.querySelectorAll<HTMLElement>(
          '[role="option"]:not([aria-disabled="true"])',
        ),
      )
    : [];
}

// 스크롤하는 조상 — 시트 본문 · 팝오버 · 화면
function scrollParentOf(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      p.scrollHeight > p.clientHeight
    )
      return p;
  }
  return null;
}

/**
 * 줄이 보이게 스크롤한다 — 위에 붙은 검색칸 아래로(가리지 않게). center 는 처음 열 때 지금 값을 가운데로
 */
export function revealOption(
  option: HTMLElement,
  field: HTMLElement | null,
  block: "nearest" | "center",
) {
  const scroller = scrollParentOf(option);
  if (!scroller) return;
  const box = scroller.getBoundingClientRect();
  const rect = option.getBoundingClientRect();
  const covered =
    field && scroller.contains(field)
      ? Math.max(0, field.getBoundingClientRect().bottom - box.top)
      : 0;
  const top = box.top + covered;
  if (block === "center") {
    scroller.scrollTop +=
      rect.top + rect.height / 2 - (top + (box.bottom - top) / 2);
    return;
  }
  if (rect.top < top) scroller.scrollTop -= top - rect.top;
  else if (rect.bottom > box.bottom)
    scroller.scrollTop += rect.bottom - box.bottom;
}
