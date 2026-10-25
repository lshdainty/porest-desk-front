import {
  BANK_ENTRIES_BY_CATEGORY,
  INVEST_CATEGORIES,
  type BankCategory,
  type BankEntry,
} from "@/shared/lib/groo/bank-colors";
import type { CardCatalogSummary } from "@/entities/card";
import { type Asset, type HoldingType, type AssetType } from "@/entities/asset";

export const INVEST_CATEGORY_SET = new Set<BankCategory>(INVEST_CATEGORIES);

/** 기관 분류 라벨 키 — 카테고리 자체는 한국 금융권 분류라 한글이 원문이지만,
 *  화면 라벨은 로케일을 따른다(영어 사용자에게 '시중은행' 이 그대로 나오면 안 된다). */
export const CATEGORY_LABEL_KEY: Record<BankCategory, string> = {
  시중은행: "editDialog.category.commercialBank",
  인터넷은행: "editDialog.category.internetBank",
  지방은행: "editDialog.category.localBank",
  특수은행: "editDialog.category.specialBank",
  저축기관: "editDialog.category.savingsInstitution",
  외국계: "editDialog.category.foreignBank",
  기타: "editDialog.category.other",
  증권사: "editDialog.category.brokerage",
  상품거래소: "editDialog.category.commodityExchange",
  가상자산: "editDialog.category.cryptoExchange",
};

export type AssetGroup = "account" | "card" | "invest";

// 투자 보유 편집 행 — 로컬 편집용(react key + 검색 시 확보한 표시명 보관).
export type EditHolding = {
  key: string;
  rowId?: number;
  holdingType: HoldingType;
  linked: boolean;
  /** 종목 검색이 준 시장코드 — 저장 때 그대로 돌려보낸다(같은 티커가 여러 시장에 걸린다) */
  marketCode?: string;
  tossSymbol?: string;
  /** 소수 허용(코인 0.05·금 3.75g). 입력 중 상태를 보존하려 문자열로 다룬다 */
  quantity?: string;
  holdingName?: string;
  holdingValue?: number;
  /** 총 매수원가 — 실현손익의 기준. 안 적으면 서버가 기존 값을 잇는다. */
  totalCost?: number;
  /** 검색에서 추가한 연동 항목의 종목명(표시용 — payload 미포함) */
  displayName?: string;
};

let editHoldingSeq = 0;
export const nextHoldingKey = () => `eh-${++editHoldingSeq}`;

/** 계좌 별칭 상한 — 목록 행·홈 카드 한 줄에 들어가는 길이(QA #16, 서버 컬럼은 100). */
export const ASSET_NAME_MAX = 30;

/**
 * 1400.000000 을 1400 으로 — 서버가 소수 6자리로 주는 환율을 그대로 채워 두면
 * 편집 폼이 지저분하고, 사용자가 고치려고 통째로 지웠다 다시 적게 된다.
 * 앱 `trimExchangeRate` 와 같은 규칙이다(desk-app #330).
 */
export const trimRate = (rate: number): string => {
  const s = rate.toFixed(6);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
};

export const GROUP_NOUN_KEY: Record<AssetGroup, string> = {
  account: "group.account",
  card: "group.card",
  invest: "group.invest",
};

export const groupOfType = (t: AssetType): AssetGroup => {
  if (t === "CREDIT_CARD" || t === "CHECK_CARD") return "card";
  if (t === "INVESTMENT") return "invest";
  return "account";
};

export const INVEST_BRANDS: BankEntry[] = INVEST_CATEGORIES.flatMap(
  (cat) => BANK_ENTRIES_BY_CATEGORY[cat] ?? [],
);

/** 자산에 붙어 있는 카드 카탈로그 → 선택 상태로 쓸 요약. 카드 편집이 아니면 없음. */
export function cardSummaryOf(
  item: Asset | null | undefined,
  editingGroup: AssetGroup,
): CardCatalogSummary | null {
  if (!item || editingGroup !== "card" || !item.cardCatalog) return null;
  return {
    rowId: item.cardCatalog.rowId,
    externalCardId: 0,
    cardName: item.cardCatalog.cardName,
    cardType: item.assetType === "CHECK_CARD" ? "CHECK" : "CREDIT",
    benefitType: "POINT",
    isDiscontinued: "N",
    onlyOnline: "N",
    launchDate: null,
    imgUrl: item.cardCatalog.imgUrl,
    detailUrl: null,
    annualFee: null, // 자산에서 만든 임시 요약 — 연회비를 모르는 상태다
    performance: { requiredAmount: 0, requiredText: null, isRequired: "N" },
    company: item.cardCatalog.companyName
      ? {
          rowId: 0,
          name: item.cardCatalog.companyName,
          nameEng: "",
          logoUrl: item.cardCatalog.companyLogoUrl,
        }
      : null,
  };
}
