// 시트를 열면 초점이 시트 표면으로 간다 — 열기 버튼에 남지 않는다(03F-008a).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

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

it("열자마자 activeElement 는 시트 표면이다", async () => {
  act(() =>
    root.render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>필터</DrawerTitle>
          <input aria-label="금액" />
        </DrawerContent>
      </Drawer>,
    ),
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
  const sheet = document.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(document.activeElement).toBe(sheet);
});
