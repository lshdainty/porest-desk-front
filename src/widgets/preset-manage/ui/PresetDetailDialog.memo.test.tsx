// 프리셋의 이 값은 어디서나 **메모** 다 (QA 12차 결정).
//
// 값은 하나인데 이름이 화면마다 갈려 있었다 — 편집 폼은 `메모`(desk-app #330 과 같은
// 이름), 상세는 `세부`. 불러오면 거래 시트의 **메모** 칸으로 그대로 들어가는 값이라
// 사용자가 따라가는 흐름의 이름은 메모 하나다.
//
// 이름은 `expense:memo` 하나를 두 화면이 같이 쓴다 — 새로 만들면 다시 갈린다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpenseTemplate } from "@/entities/expense-template";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { PresetDetailDialog } = await import("./PresetDetailDialog");

const preset = {
  rowId: 5,
  templateName: "점심",
  expenseType: "EXPENSE",
  categoryRowId: null,
  assetRowId: null,
  assetName: null,
  categoryName: null,
  merchant: "한솥",
  description: "법인카드로 결제",
  paymentMethod: "CARD",
  amount: 9_000,
  lockAmount: "Y",
  useCount: 3,
  lastUsedAt: null,
} as unknown as ExpenseTemplate;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <PresetDetailDialog
        preset={preset}
        categories={[]}
        mobile={false}
        onClose={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("프리셋 상세", () => {
  it("메모 칸의 이름은 `메모` 다 — 편집 폼·거래 시트와 같은 키를 쓴다", () => {
    const shown = document.body.textContent ?? "";
    expect(shown).toContain("법인카드로 결제");
    expect(shown).toContain("memo");
    // `세부`(addTx.detail)로 되돌아가면 여기가 빨개진다.
    expect(shown).not.toContain("addTx.detail");
  });
});
