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

// ── 거르는 규칙 ───────────────────────────────────────────────
// NFC 로 맞추고 소문자로 바꾸고 공백을 모두 지운다 — "kx 은행" · "KX은행" · 조합형 한글이 같은 글이 된다
const foldForSearch = (text: string) =>
  text.normalize("NFC").toLowerCase().replace(/\s+/g, "");

/** 거르는 규칙 — 이름 · 별칭 중 하나에 검색어가 들어 있으면 true(빈 검색어는 모두 남긴다). 초성 검색은 하지 않는다 */
export function matchesSearch(
  query: string,
  ...names: (string | null | undefined)[]
): boolean {
  const q = foldForSearch(query);
  if (q === "") return true;
  return names.some((name) => name != null && foldForSearch(name).includes(q));
}

// ── 첫 초점 ──────────────────────────────────────────────────
/**
 * 시트 · 팝오버의 onOpenAutoFocus 에 건다 — 표면 대신 검색칸에 첫 초점을 주고, 지금 값이 보이게 가운데로 스크롤한다.
 * 열린 뒤 다시 옮기지 않는다(시트가 넘겨주는 한 번뿐이다).
 */
export function focusSearchableList(event: Event) {
  const surface =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  const input = surface?.querySelector<HTMLInputElement>(
    '[data-slot="searchable-list-field"] input',
  );
  if (!surface || !input) return;
  event.preventDefault();
  input.focus({ preventScroll: true });
  const current = surface.querySelector<HTMLElement>(
    '[data-slot="searchable-list-item"][aria-selected="true"]',
  );
  const field = input.closest<HTMLElement>(
    '[data-slot="searchable-list-field"]',
  );
  if (current) revealOption(current, field, "center");
}
