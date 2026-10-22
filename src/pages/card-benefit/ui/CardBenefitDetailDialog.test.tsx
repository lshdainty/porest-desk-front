// 혜택 줄 단추 — 펼침 상태를 읽는다(accordion.md "heading > button · aria-expanded · aria-controls", 03G-011a).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/shared/ui/groo/dialogs", () => ({
  ModalShell: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/shared/ui/groo/modal-footer", () => ({
  ModalViewFooter: () => null,
}));

const detail = {
  summary: {
    rowId: 1,
    externalCardId: 1,
    company: null,
    cardName: "예시 카드",
    cardType: "CREDIT",
    benefitType: "DISCOUNT",
    isDiscontinued: "N",
    onlyOnline: "N",
    launchDate: null,
    imgUrl: null,
    detailUrl: null,
    annualFee: null,
    performance: { isRequired: "N", requiredText: null },
  },
  brands: [],
  benefits: [
    {
      rowId: 11,
      category: "커피",
      categoryIcon: null,
      title: "커피 할인",
      summary: "10% 할인",
      detail: "전국 커피 전문점에서 10% 를 깎아 줘요",
      sortOrder: 1,
    },
    {
      rowId: 12,
      category: "교통",
      categoryIcon: null,
      title: "교통 적립",
      summary: "5% 적립",
      detail: null,
      sortOrder: 2,
    },
  ],
  cautions: [],
  topBenefits: [],
  searchBenefits: [],
};
vi.mock("@/features/card-catalog", () => ({
  useCardCatalogDetail: () => ({
    data: detail,
    isLoading: false,
    isError: false,
  }),
}));

const { CardBenefitDetailDialog } = await import("./CardBenefitDetailDialog");

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
});

const benefitButtons = () => [
  ...container.querySelectorAll<HTMLButtonElement>("button[aria-expanded]"),
];

describe("CardBenefitDetailDialog 혜택 줄", () => {
  it("혜택 줄 단추는 aria-expanded 와 aria-controls 를 단다 — 접힘 → 펼침 → 접힘", () => {
    act(() =>
      root.render(
        <CardBenefitDetailDialog rowId={1} onClose={() => {}} mobile={false} />,
      ),
    );
    const [coffee, transit] = benefitButtons();
    expect(benefitButtons()).toHaveLength(2);
    expect(coffee!.getAttribute("aria-expanded")).toBe("false");
    expect(transit!.getAttribute("aria-expanded")).toBe("false");
    const controls = coffee!.getAttribute("aria-controls")!;
    expect(controls).toBeTruthy();
    expect(controls).not.toBe(transit!.getAttribute("aria-controls"));
    expect(container.querySelector(`[id="${controls}"]`)).toBeNull();

    act(() => coffee!.click());
    expect(coffee!.getAttribute("aria-expanded")).toBe("true");
    const panel = container.querySelector(`[id="${controls}"]`)!;
    expect(panel.textContent).toContain("10% 를 깎아 줘요");

    act(() => coffee!.click());
    expect(coffee!.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector(`[id="${controls}"]`)).toBeNull();
  });
});
