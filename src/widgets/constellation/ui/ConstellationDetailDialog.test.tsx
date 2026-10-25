// 별자리 상세(I-11 23) — 실제 부품을 띄운 채로 잠근다. 번역은 CSV 원본에서 읽는다.
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CollectionEntry } from "@/features/constellation";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const COPY: Record<string, string> = {};
for (const line of readFileSync("i18n/translations.csv", "utf-8").split("\n")) {
  const m = /^constellation,([^,]+),("(?:[^"]|"")*"|[^,]*),/.exec(line);
  if (m) COPY[m[1]!] = m[2]!.replace(/^"|"$/g, "");
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) =>
      (COPY[k] ?? k).replace(/\{\{(\w+)\}\}/g, (_m, n: string) =>
        String(opts?.[n] ?? ""),
      ),
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { ConstellationDetailDialog } =
  await import("./ConstellationDetailDialog");

const make = (count: number): CollectionEntry => ({
  collectCount: count,
  lastCollectedDate: count ? "2026-10-21" : null,
  constellation: {
    rowId: 1,
    constellationKey: "cen",
    name: "켄타우루스자리",
    nameEn: "Centaurus",
    description: "반은 사람이고 반은 말인 별자리",
    descriptionEn: null,
    colorKey: "blue",
    starCount: 16,
    starMap: JSON.stringify({
      pts: [
        [10, 10],
        [50, 50],
      ],
      edges: [[0, 1]],
    }),
    sortOrder: 1,
  },
});

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  if (!globalThis.ResizeObserver)
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
});

const text = () => document.body.textContent ?? "";

describe("ConstellationDetailDialog", () => {
  it("제목은 별자리 이름이고 별 개수 · 수집 줄이 있다", () => {
    act(() =>
      root.render(
        <ConstellationDetailDialog entry={make(21)} onClose={() => {}} />,
      ),
    );
    const title = document.querySelector(
      "[role=dialog] h2, [role=dialog] [data-slot$=title]",
    );
    expect(title?.textContent).toBe("켄타우루스자리");
    expect(text()).toContain("별 개수");
    expect(text()).toContain("16개");
    expect(text()).toContain("21번");
    expect(text()).not.toContain("별자리 도감");
  });
  it("못 모은 별자리는 미수집 · 불투명 안내 글이고 바닥 버튼이 없다", () => {
    act(() =>
      root.render(
        <ConstellationDetailDialog entry={make(0)} onClose={() => {}} />,
      ),
    );
    expect(text()).toContain("미수집");
    const note = [...document.querySelectorAll("p")].find((p) =>
      p.textContent?.includes("아직 만나지 못한"),
    );
    expect(note?.className).toContain("text-fg-neutral-inverted");
    expect(note?.className).not.toMatch(/opacity/);
    expect(document.querySelector("[data-slot$=footer]")).toBeNull();
  });
});
