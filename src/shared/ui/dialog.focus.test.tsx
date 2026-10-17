// 열면 초점이 표면(대화상자 자체)으로 간다 — 첫 칸이 아니다(03F-006). 닫는 길 · 가둠은 Radix 가 맡는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { Dialog, DialogContent, DialogTitle, DialogDescription } =
  await import("./dialog");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
});

it("열자마자 activeElement 는 대화상자 표면이다(안의 입력칸이 아니다)", async () => {
  act(() =>
    root.render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>제목</DialogTitle>
          <DialogDescription>설명</DialogDescription>
          <input aria-label="금액" />
        </DialogContent>
      </Dialog>,
    ),
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(document.activeElement).toBe(dialog);
});
