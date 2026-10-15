// Pagination 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Pagination } from "./pagination";
import { paginationItems, type PaginationItem } from "./pagination-variants";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;
const originalMatchMedia = window.matchMedia;

// 화면 폭 — 480 이상이면 9칸, 미만이면 7칸
function setWide(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  setWide(true);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = originalMatchMedia;
});

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement | null;
}

const one = <T extends HTMLElement = HTMLElement>(selector: string) =>
  container.querySelector<T>(selector)!;
const cells = () =>
  Array.from(
    container.querySelectorAll<HTMLElement>("[data-slot=pagination-row] > *"),
  );
const click = (el: Element) => act(() => (el as HTMLElement).click());
const status = () => one("[data-slot=pagination-status]").textContent;

// 칸 배열을 글자로 — ‹ 1 … 4 5 6 … 12 › · 빈 칸 _
const show = (items: PaginationItem[]) =>
  items
    .map((i) =>
      i.type === "page"
        ? String(i.page)
        : i.type === "ellipsis"
          ? "…"
          : i.type === "previous"
            ? "‹"
            : i.type === "next"
              ? "›"
              : "_",
    )
    .join(" ");

describe("paginationItems — 칸 배열 규칙", () => {
  it("9칸 — 앞쪽 · 가운데 · 뒤쪽", () => {
    expect(show(paginationItems(1, 12, 9))).toBe("_ 1 2 3 4 5 … 12 ›");
    expect(show(paginationItems(4, 12, 9))).toBe("‹ 1 2 3 4 5 … 12 ›");
    expect(show(paginationItems(5, 12, 9))).toBe("‹ 1 … 4 5 6 … 12 ›");
    expect(show(paginationItems(8, 12, 9))).toBe("‹ 1 … 7 8 9 … 12 ›");
    expect(show(paginationItems(9, 12, 9))).toBe("‹ 1 … 8 9 10 11 12 ›");
    expect(show(paginationItems(12, 12, 9))).toBe("‹ 1 … 8 9 10 11 12 _");
  });

  it("7칸 — 가운데 구간에는 첫 · 마지막 번호가 없다", () => {
    expect(show(paginationItems(1, 12, 7))).toBe("_ 1 2 3 4 … ›");
    expect(show(paginationItems(3, 12, 7))).toBe("‹ 1 2 3 4 … ›");
    expect(show(paginationItems(6, 12, 7))).toBe("‹ … 5 6 7 … ›");
    expect(show(paginationItems(10, 12, 7))).toBe("‹ … 9 10 11 12 ›");
    expect(show(paginationItems(12, 12, 7))).toBe("‹ … 9 10 11 12 _");
  });

  it("전체 쪽이 칸 수보다 적으면 모든 번호를 보인다 · 1쪽 이하면 빈 배열", () => {
    expect(show(paginationItems(2, 3, 9))).toBe("‹ 1 2 3 ›");
    expect(show(paginationItems(4, 7, 9))).toBe("‹ 1 2 3 4 5 6 7 ›");
    expect(show(paginationItems(1, 5, 7))).toBe("_ 1 2 3 4 5 ›");
    expect(paginationItems(1, 1)).toEqual([]);
    expect(paginationItems(1, 0)).toEqual([]);
    expect(paginationItems(1, Number.NaN)).toEqual([]);
  });

  it("쪽은 1 ~ 마지막 사이로 맞춘다 · 칸 수는 늘 같다(자리가 흔들리지 않는다)", () => {
    expect(show(paginationItems(99, 12, 9))).toBe("‹ 1 … 8 9 10 11 12 _");
    expect(show(paginationItems(-3, 12, 9))).toBe("_ 1 2 3 4 5 … 12 ›");
    for (let p = 1; p <= 40; p++) {
      expect(paginationItems(p, 40, 9)).toHaveLength(9);
      expect(paginationItems(p, 40, 7)).toHaveLength(7);
    }
  });
});

describe("Pagination — 구조 · 이름", () => {
  it('nav "페이지 탐색" · 칸 "N페이지" · 화살표 "이전 페이지" · "다음 페이지"', () => {
    const nav = render(<Pagination totalPages={12} defaultPage={5} />)!;
    expect(nav.tagName).toBe("NAV");
    expect(nav.getAttribute("aria-label")).toBe("페이지 탐색");
    const names = cells().map((c) => c.getAttribute("aria-label"));
    expect(names).toEqual([
      "이전 페이지",
      "1페이지",
      null,
      "4페이지",
      "5페이지",
      "6페이지",
      null,
      "12페이지",
      "다음 페이지",
    ]);
  });

  it("aria-label 을 바꿀 수 있다(목록이 둘 이상일 때)", () => {
    const nav = render(
      <Pagination totalPages={12} aria-label="카드 혜택 페이지 탐색" />,
    )!;
    expect(nav.getAttribute("aria-label")).toBe("카드 혜택 페이지 탐색");
  });

  it("지금 쪽만 aria-current=page · 짙은 채움 + 반전 글자 — 브랜드 색이 아니다", () => {
    render(<Pagination totalPages={12} defaultPage={5} />);
    const current = one("[aria-current=page]");
    expect(current.getAttribute("aria-label")).toBe("5페이지");
    expect(current.className).toContain("bg-bg-neutral-inverted");
    expect(current.className).toContain("text-fg-neutral-inverted");
    expect(current.className).not.toMatch(/brand/);
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(1);
    const other = one("[data-slot=pagination-item][data-page='4']");
    expect(other.className).toContain("hover:bg-bg-layer-default-pressed");
    expect(other.className).not.toContain("bg-bg-neutral-inverted");
  });

  it("생략 · 빈 칸은 보조 기술에 숨기고 누르지 않는다", () => {
    render(<Pagination totalPages={12} defaultPage={1} />);
    expect(
      one("[data-slot=pagination-empty]").getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      one("[data-slot=pagination-ellipsis]").getAttribute("aria-hidden"),
    ).toBe("true");
    expect(one("[data-slot=pagination-ellipsis]").tagName).toBe("SPAN");
    expect(one("[data-slot=pagination-empty]").tagName).toBe("SPAN");
  });

  it("1쪽 이하면 그리지 않는다", () => {
    expect(render(<Pagination totalPages={1} />)).toBeNull();
    expect(render(<Pagination totalPages={0} />)).toBeNull();
  });

  it("칸은 40 · 모서리 8 · 누르는 영역은 위아래만 44 · 누르면 2px 거리 축소(모션 줄이기면 색만) · 칸 사이는 없다", () => {
    render(<Pagination totalPages={12} defaultPage={5} />);
    const item = one("[data-slot=pagination-item][data-page='4']");
    for (const c of [
      "size-10",
      "rounded-r2",
      "before:inset-y-[-2px]",
      "active:[scale:calc(1-2/40)]",
      "motion-reduce:active:[scale:1]",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:z-[1]",
    ])
      expect(item.className).toContain(c);
    expect(one("[data-slot=pagination-row]").className).toContain("gap-0");
    expect(one("[data-slot=pagination]").className).toContain("justify-center");
    expect(one("[data-slot=pagination]").className).toContain("mt-x6");
  });

  it("번호는 14 · 700 · 숫자 폭 고정 · 세 자리마다 쉼표 · 칸을 넘으면 말줄임", () => {
    render(<Pagination totalPages={12_345} defaultPage={6_172} />);
    const labels = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot=pagination-label]"),
    ).map((l) => l.textContent);
    expect(labels).toContain("6,172");
    expect(labels).toContain("12,345");
    const label = one("[data-slot=pagination-label]");
    for (const c of ["text-t4", "font-bold", "tabular-nums", "truncate"])
      expect(label.className).toContain(c);
    expect(one("[aria-current=page]").getAttribute("aria-label")).toBe(
      "6,172페이지",
    );
  });

  it("ref · className · 나머지 속성을 nav 에 넘긴다", () => {
    const ref = createRef<HTMLElement>();
    const nav = render(
      <Pagination ref={ref} totalPages={5} className="mt-0" id="pg" />,
    )!;
    expect(ref.current).toBe(nav);
    expect(nav.className).toContain("mt-0");
    expect(nav.id).toBe("pg");
  });
});

describe("Pagination — 칸 수 9 · 7", () => {
  it("480 이상 9칸(360) · 미만 7칸(280)", () => {
    render(<Pagination totalPages={12} defaultPage={5} />);
    expect(cells()).toHaveLength(9);
    expect(one("[data-slot=pagination]").dataset.slots).toBe("9");
    setWide(false);
    act(() => root.unmount());
    root = createRoot(container);
    render(<Pagination totalPages={12} defaultPage={5} />);
    expect(cells()).toHaveLength(7);
    expect(one("[data-slot=pagination]").dataset.slots).toBe("7");
  });

  it("matchMedia 가 없으면 7칸", () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    render(<Pagination totalPages={12} defaultPage={5} />);
    expect(cells()).toHaveLength(7);
  });
});

describe("Pagination — 넘기기", () => {
  function Controlled({
    onChange,
    scrollTarget,
    getHref,
  }: {
    onChange?: (p: number, reason: string) => void;
    scrollTarget?: React.RefObject<HTMLElement | null>;
    getHref?: (p: number) => string;
  }) {
    const [page, setPage] = useState(5);
    return (
      <Pagination
        totalPages={12}
        page={page}
        scrollTarget={scrollTarget}
        getHref={getHref}
        onPageChange={(p, d) => {
          setPage(p);
          onChange?.(p, d.reason);
        }}
      />
    );
  }

  it('번호 · 이전 · 다음 — reason 을 알리고 상태 글 "N페이지, 전체 M페이지" 를 한 번 알린다(처음에는 비어 있다)', () => {
    const calls: [number, string][] = [];
    render(<Controlled onChange={(p, r) => calls.push([p, r])} />);
    expect(status()).toBe("");
    expect(one("[data-slot=pagination-status]").getAttribute("role")).toBe(
      "status",
    );
    click(one("[data-slot=pagination-item][data-page='6']"));
    expect(status()).toBe("6페이지, 전체 12페이지");
    click(one("[data-slot=pagination-previous]"));
    click(one("[data-slot=pagination-previous]"));
    click(one("[data-slot=pagination-next]"));
    expect(calls).toEqual([
      [6, "page-item"],
      [5, "previous"],
      [4, "previous"],
      [5, "next"],
    ]);
    expect(status()).toBe("5페이지, 전체 12페이지");
  });

  it("제어하지 않으면 스스로 넘긴다 · 지금 쪽을 누르면 아무 일이 없다", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        totalPages={12}
        defaultPage={5}
        onPageChange={onPageChange}
      />,
    );
    click(one("[aria-current=page]"));
    expect(onPageChange).not.toHaveBeenCalled();
    click(one("[data-slot=pagination-item][data-page='4']"));
    expect(onPageChange).toHaveBeenCalledWith(4, { reason: "page-item" });
    expect(one("[aria-current=page]").getAttribute("aria-label")).toBe(
      "4페이지",
    );
  });

  it("넘기면 목록 맨 위로 스크롤한다 — 바깥에서 쪽이 바뀐 것은 스크롤하지 않는다", () => {
    const scrollIntoView = vi.fn();
    const target = document.createElement("div");
    target.scrollIntoView = scrollIntoView;
    const scrollTarget = { current: target };
    render(<Controlled scrollTarget={scrollTarget} />);
    click(one("[data-slot=pagination-item][data-page='6']"));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    scrollIntoView.mockClear();
    // 같은 줄의 쪽이 바깥에서 바뀐다
    render(<Pagination totalPages={12} page={6} scrollTarget={scrollTarget} />);
    render(<Pagination totalPages={12} page={9} scrollTarget={scrollTarget} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(status()).toBe("9페이지, 전체 12페이지");
  });

  it("초점은 누른 칸에 남는다 — 번호를 눌렀으면 그 쪽 번호(칸 자리가 바뀌어도 따라간다)", () => {
    render(<Controlled />);
    const six = one("[data-slot=pagination-item][data-page='6']");
    six.focus();
    click(six);
    // 6쪽이 가운데에 오며 칸 자리가 옮겨 간다 — 초점은 6쪽 번호에
    expect(document.activeElement).toBe(
      one("[data-slot=pagination-item][data-page='6']"),
    );
    expect(document.activeElement!.getAttribute("aria-current")).toBe("page");
  });

  it("화살표를 눌렀으면 그 화살표에 남는다", () => {
    render(<Controlled />);
    const next = one("[data-slot=pagination-next]");
    next.focus();
    click(next);
    expect(document.activeElement).toBe(one("[data-slot=pagination-next]"));
  });

  it("끝 쪽에 닿아 누르던 화살표가 빈 칸이 되면 초점을 지금 쪽 번호로 옮긴다", () => {
    function Ends() {
      const [page, setPage] = useState(11);
      return <Pagination totalPages={12} page={page} onPageChange={setPage} />;
    }
    render(<Ends />);
    const next = one("[data-slot=pagination-next]");
    next.focus();
    click(next);
    expect(one("[data-slot=pagination-next]")).toBeNull();
    expect(one("[data-slot=pagination-empty]")).not.toBeNull();
    expect(document.activeElement).toBe(one("[aria-current=page]"));
    expect(document.activeElement!.getAttribute("aria-label")).toBe("12페이지");
  });

  it("누를 때 초점이 줄 밖에 있었으면 옮기지 않는다", () => {
    render(<Controlled />);
    (document.activeElement as HTMLElement | null)?.blur();
    click(one("[data-slot=pagination-item][data-page='6']"));
    expect(container.contains(document.activeElement)).toBe(false);
  });
});

describe("Pagination — 링크(getHref)", () => {
  it("칸이 링크(<a>)다 — 화살표 포함, href 는 그 쪽 주소", () => {
    render(
      <Pagination
        totalPages={12}
        defaultPage={5}
        getHref={(p) => `#page=${p}`}
      />,
    );
    for (const c of cells().filter(
      (c) => c.hasAttribute("data-slot") && c.tagName === "A",
    )) {
      expect(c.getAttribute("href")).toMatch(/^#page=\d+$/);
    }
    expect(one("[data-slot=pagination-item][data-page='6']").tagName).toBe("A");
    expect(
      one("[data-slot=pagination-item][data-page='6']").getAttribute("href"),
    ).toBe("#page=6");
    expect(one("[data-slot=pagination-previous]").getAttribute("href")).toBe(
      "#page=4",
    );
    expect(one("[data-slot=pagination-next]").getAttribute("href")).toBe(
      "#page=6",
    );
  });

  it("그냥 누르면 onPageChange 로 넘기고 링크의 기본 이동은 막는다", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        totalPages={12}
        defaultPage={5}
        getHref={(p) => `#page=${p}`}
        onPageChange={onPageChange}
      />,
    );
    const link = one("[data-slot=pagination-item][data-page='6']");
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => {
      link.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onPageChange).toHaveBeenCalledWith(6, { reason: "page-item" });
  });

  it("새 탭 · 수정 키 누르기는 브라우저에 맡긴다", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        totalPages={12}
        defaultPage={5}
        getHref={(p) => `#page=${p}`}
        onPageChange={onPageChange}
      />,
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });
    act(() => {
      one("[data-slot=pagination-item][data-page='6']").dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("지금 쪽 링크는 눌러도 가지 않는다", () => {
    render(
      <Pagination
        totalPages={12}
        defaultPage={5}
        getHref={(p) => `#page=${p}`}
      />,
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => {
      one("[aria-current=page]").dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("Pagination — 막힘", () => {
  it("disabled 면 모든 칸이 aria-disabled · fg-disabled · 눌러도 아무 일이 없다 — 지금 쪽은 bg-disabled", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        totalPages={12}
        defaultPage={5}
        disabled
        onPageChange={onPageChange}
      />,
    );
    const live = cells().filter((c) => c.tagName === "BUTTON");
    expect(live).toHaveLength(7);
    for (const c of live) {
      expect(c.getAttribute("aria-disabled")).toBe("true");
      expect(c.className).toContain("text-fg-disabled");
      expect(c.className).toContain("cursor-not-allowed");
      expect(c.className).not.toContain("hover:");
      expect(c.className).not.toContain("active:");
    }
    expect(one("[aria-current=page]").className).toContain("bg-bg-disabled");
    expect(one("[aria-current=page]").className).not.toContain(
      "bg-bg-neutral-inverted",
    );
    click(one("[data-slot=pagination-item][data-page='6']"));
    click(one("[data-slot=pagination-next]"));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
