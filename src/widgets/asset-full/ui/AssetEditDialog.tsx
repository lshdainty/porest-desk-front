import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Plus, Search, Trash2, Wallet } from "lucide-react";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter } from "@/shared/ui/porest/modal-footer";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  SearchableList,
  SearchableListItem,
} from "@/shared/ui/searchable-list";
import { Switch } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useAssets } from "@/features/asset";
import { KRW } from "@/shared/lib/porest/format";
import {
  MAX_BALANCE,
  blockNonDigitKey,
  sanitizeAmountInput,
} from "@/shared/lib/porest/amount";
import { nameIssue } from "@/shared/lib/porest/name-policy";
import {
  ACCOUNT_SUBS,
  ACCOUNT_SUB_KEY,
  assetTypeToSub,
  signedBalanceOf,
  subToAssetType,
  type AccountSub,
} from "../lib/account-sub";
import { NameCounter } from "@/shared/ui/porest/name-counter";
import {
  getBrandColor,
  BANK_ENTRIES,
  BANK_ENTRIES_BY_CATEGORY,
  BANK_CATEGORY_ORDER,
  INVEST_CATEGORIES,
  CATEGORY_HOLDING_TYPE,
  type BankCategory,
  type BankEntry,
} from "@/shared/lib/porest/bank-colors";

const INVEST_CATEGORY_SET = new Set<BankCategory>(INVEST_CATEGORIES);

/** 기관 분류 라벨 키 — 카테고리 자체는 한국 금융권 분류라 한글이 원문이지만,
 *  화면 라벨은 로케일을 따른다(영어 사용자에게 '시중은행' 이 그대로 나오면 안 된다). */
const CATEGORY_LABEL_KEY: Record<BankCategory, string> = {
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
import { useCardCatalogs } from "@/features/card-catalog";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import type { CardCatalogSummary, CardType } from "@/entities/card";
import {
  AssetLogo,
  type Asset,
  type AssetFormValues,
  type AssetHolding,
  type HoldingType,
  HOLDING_UNIT_KEY,
  HOLDING_TYPES,
  sanitizeQty,
  qtyNumber,
  normalizeQty,
  type AssetType,
  type AssetUpdateFormValues,
} from "@/entities/asset";
import type { YNType } from "@/shared/types";
import {
  useStockSearch,
  useStockSymbolName,
} from "@/features/stock/model/useStockMaster";
import { useLivePrices } from "@/features/stock/model/useLivePrices";
import { useMyFeatures } from "@/features/subscription/model/useSubscription";
import { Button } from "@/shared/ui/button";

export type AssetGroup = "account" | "card" | "invest";

// 투자 보유 편집 행 — 로컬 편집용(react key + 검색 시 확보한 표시명 보관).
type EditHolding = {
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
const nextHoldingKey = () => `eh-${++editHoldingSeq}`;

/** 검색 입력 디바운스 — 키 입력마다 서버 검색이 나가지 않게 한다. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** 연동 항목 이름 — 저장돼 있던 항목은 심볼→마스터 이름 조회(캐시), 검색 추가분은 displayName. */
function LinkedHoldingName({ holding }: { holding: EditHolding }) {
  const { data: masterName } = useStockSymbolName(
    holding.displayName ? "" : (holding.tossSymbol ?? ""),
  );
  return <>{holding.displayName ?? masterName ?? holding.tossSymbol ?? ""}</>;
}

/** 계좌 별칭 상한 — 목록 행·홈 카드 한 줄에 들어가는 길이(QA #16, 서버 컬럼은 100). */
const ASSET_NAME_MAX = 30;

const GROUP_NOUN_KEY: Record<AssetGroup, string> = {
  account: "group.account",
  card: "group.card",
  invest: "group.invest",
};

const groupOfType = (t: AssetType): AssetGroup => {
  if (t === "CREDIT_CARD" || t === "CHECK_CARD") return "card";
  if (t === "INVESTMENT") return "invest";
  return "account";
};

const INVEST_BRANDS: BankEntry[] = INVEST_CATEGORIES.flatMap(
  (cat) => BANK_ENTRIES_BY_CATEGORY[cat] ?? [],
);

export interface AssetEditDialogProps {
  item: Asset | null;
  group: AssetGroup;
  onClose: () => void;
  onCreate: (values: AssetFormValues) => void;
  onUpdate: (values: AssetUpdateFormValues) => void;
  mobile: boolean;
  isSubmitting?: boolean;
}

/** 자산에 붙어 있는 카드 카탈로그 → 선택 상태로 쓸 요약. 카드 편집이 아니면 없음. */
function cardSummaryOf(
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

export function AssetEditDialog({
  item,
  group,
  onClose,
  onCreate,
  onUpdate,
  mobile,
  isSubmitting,
}: AssetEditDialogProps) {
  const { t } = useTranslation("asset");
  const { t: tCommon } = useTranslation("common");
  const isNew = !item;
  const editingGroup: AssetGroup = item ? groupOfType(item.assetType) : group;

  // 공통
  const [brand, setBrand] = useState<string>(
    item?.institution ??
      (editingGroup === "invest"
        ? (INVEST_BRANDS[0]?.name ?? "삼성증권")
        : (BANK_ENTRIES[0]?.name ?? "신한")),
  );
  const [query, setQuery] = useState("");
  const [name, setName] = useState(item?.assetName ?? "");
  const [memo, setMemo] = useState(item?.memo ?? "");
  const [isIncludedInTotal, setIsIncludedInTotal] = useState<YNType>(
    item?.isIncludedInTotal ?? "Y",
  );
  // 절대값으로 보여 준다 — 부호는 종류가 정하므로 칸에 `-` 가 남아 있을 이유가 없다(QA #19).
  const [balanceStr, setBalanceStr] = useState<string>(
    item ? KRW(Math.abs(item.balance ?? 0)) : "0",
  );

  // 계좌 sub
  const [accountSub, setAccountSub] = useState<AccountSub>(
    item && editingGroup === "account"
      ? assetTypeToSub(item.assetType, item.balance ?? 0)
      : "입출금",
  );

  // 투자 — 보유 종목 다건 편집 (design AssetEditDialog invest 분기 미러).
  // 기존 holdings 우선, 구버전 단일 연동(tossSymbol)은 linked 1건으로 합성(하위호환).
  const [holdings, setHoldings] = useState<EditHolding[]>(() => {
    if (item?.holdings && item.holdings.length > 0) {
      return item.holdings.map((h) => ({
        key: nextHoldingKey(),
        rowId: h.rowId,
        // 구버전 응답(holdingType 없음)은 주식으로 본다.
        holdingType: h.holdingType ?? "STOCK",
        linked: h.linked,
        marketCode: h.marketCode ?? undefined,
        tossSymbol: h.tossSymbol ?? undefined,
        quantity: h.quantity ?? undefined,
        holdingName: h.holdingName ?? undefined,
        holdingValue: h.holdingValue ?? undefined,
        totalCost: h.totalCost ?? undefined,
      }));
    }
    if (item?.tossSymbol && item.tossQuantity != null) {
      return [
        {
          key: nextHoldingKey(),
          holdingType: "STOCK" as HoldingType,
          linked: true,
          marketCode: item.marketCode ?? undefined,
          tossSymbol: item.tossSymbol,
          quantity: String(item.tossQuantity),
        },
      ];
    }
    return [];
  });
  const [stockQ, setStockQ] = useState("");
  const debouncedStockQ = useDebounced(stockQ.trim(), 300);
  const { data: features } = useMyFeatures();
  const liveEnabled =
    (features?.features?.includes("SECURITIES") ?? false) &&
    (features?.connectedBrokers?.length ?? 0) > 0;
  const { data: stockMatches = [], isFetching: stockSearching } =
    useStockSearch(editingGroup === "invest" ? debouncedStockQ : "");
  const stockResults = useMemo(
    () =>
      stockMatches
        .filter(
          (s) => !holdings.some((h) => h.linked && h.tossSymbol === s.symbol),
        )
        .slice(0, 6),
    [stockMatches, holdings],
  );
  // 연동 항목 라이브 평가 — 시세(10초 폴링)×수량, 외화는 환율 환산. 게이트 밖이면 미평가.
  const holdingSymbols = useMemo(
    () => [
      ...new Set(
        holdings
          .filter((h) => h.linked && h.tossSymbol)
          .map((h) => h.tossSymbol as string),
      ),
    ],
    [holdings],
  );
  const priceActive =
    liveEnabled && editingGroup === "invest" && holdingSymbols.length > 0;
  const activeHoldingSymbols = useMemo(
    () => (priceActive ? holdingSymbols : []),
    [priceActive, holdingSymbols],
  );
  // 증권사 무관 경로 + 통화별 환율. 목록·상세와 같은 훅을 써야 한 화면에서 금액이 안 어긋난다.
  const live = useLivePrices(activeHoldingSymbols, priceActive);
  const holdingValueOf = useMemo(() => {
    return (h: EditHolding): number | null => {
      if (!h.linked) return h.holdingValue ?? 0;
      const krw = h.tossSymbol ? live.unitKrw(h.tossSymbol) : null;
      return krw != null
        ? Math.round(krw * (qtyNumber(h.quantity) ?? 0))
        : null;
    };
  }, [live]);
  // 합계 — 평가 불가 연동 항목은 0 취급하지 않고 '평가 가능분 합'으로 표기.
  const holdingsTotal = useMemo(
    () => holdings.reduce((s, h) => s + (holdingValueOf(h) ?? 0), 0),
    [holdings, holdingValueOf],
  );

  // 카드
  const [cardType, setCardType] = useState<CardType>(
    item?.assetType === "CHECK_CARD" ? "CHECK" : "CREDIT",
  );
  const [cardKeyword, setCardKeyword] = useState("");
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  // 편집 진입 시 기존 카드 카탈로그를 선택 상태처럼 보이도록 채움.
  //
  // 초기값으로 넣는다 — 이 컴포넌트의 `item` 기반 상태는 전부 그렇게 시드된다
  // (`cardType`·`creditLimit`·…). 이것만 effect 였고, 그래서 의존성을 `item?.rowId`
  // 하나로 좁히려 규칙을 꺼야 했다. 다이얼로그는 자산 하나마다 새로 열린다.
  const [selectedCard, setSelectedCard] = useState<CardCatalogSummary | null>(
    () => cardSummaryOf(item, editingGroup),
  );

  // 신용카드 청구사이클 (CREDIT_CARD 전용)
  const [creditLimit, setCreditLimit] = useState<string>(
    item?.creditLimit != null ? String(item.creditLimit) : "",
  );
  const [paymentDay, setPaymentDay] = useState<string>(
    item?.paymentDay != null ? String(item.paymentDay) : "",
  );
  const [paymentAssetRowId, setPaymentAssetRowId] = useState<number | null>(
    item?.paymentAssetRowId ?? null,
  );

  const { data: assetsData } = useAssets();
  const bankAccounts = useMemo(
    () =>
      (assetsData?.assets ?? []).filter(
        (a) => a.assetType === "BANK_ACCOUNT" && a.rowId !== item?.rowId,
      ),
    [assetsData, item?.rowId],
  );

  const catalogQ = useCardCatalogs({
    keyword: cardKeyword.trim() || undefined,
    cardType,
    includeDiscontinued: includeDiscontinued || undefined,
    page: 0,
    size: 40,
  });
  const catalogItems = catalogQ.data?.content ?? [];

  // 은행 검색 (category 묶음 — 투자용 카테고리는 제외)
  const matchesQuery = (e: BankEntry, q: string) => {
    if (!q) return true;
    const needle = q.toLowerCase().replace(/\s+/g, "");
    if (e.name.toLowerCase().replace(/\s+/g, "").includes(needle)) return true;
    return (e.aliases ?? []).some((a) =>
      a.toLowerCase().replace(/\s+/g, "").includes(needle),
    );
  };

  const bankFilteredByCategory = useMemo(() => {
    const result: [BankCategory, BankEntry[]][] = [];
    for (const cat of BANK_CATEGORY_ORDER) {
      if (INVEST_CATEGORY_SET.has(cat)) continue;
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter((e) =>
        matchesQuery(e, query),
      );
      if (list.length > 0) result.push([cat, list]);
    }
    return result;
  }, [query]);

  const investFilteredByCategory = useMemo(() => {
    const result: [BankCategory, BankEntry[]][] = [];
    for (const cat of INVEST_CATEGORIES) {
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter((e) =>
        matchesQuery(e, query),
      );
      if (list.length > 0) result.push([cat, list]);
    }
    return result;
  }, [query]);

  const investFilteredCount = investFilteredByCategory.reduce(
    (sum, [, list]) => sum + list.length,
    0,
  );

  // 색/미리보기
  const cardCompanyName =
    selectedCard?.company?.name ?? item?.institution ?? "";
  const cardBrandColor = useMemo(
    () => getBrandColor(cardCompanyName, selectedCard?.cardName),
    [cardCompanyName, selectedCard?.cardName],
  );
  // 기관이 보유 유형을 정한다 — 증권사에서 코인을, 금거래소에서 주식을 담을 일은 없다.
  // 모르는 기관(직접 입력·구버전 데이터)이면 셋 다 열어 둔다.
  const brandHoldingType = useMemo<HoldingType | null>(() => {
    const cat = BANK_ENTRIES.find((e) => e.name === brand)?.category;
    return cat ? (CATEGORY_HOLDING_TYPE[cat] ?? null) : null;
  }, [brand]);
  const allowStock = brandHoldingType === null || brandHoldingType === "STOCK";
  /**
   * 손으로 추가하는 보유의 유형.
   *
   * <p>기관이 정해져 있으면 그 카테고리를 따른다(상품거래소=금, 코인거래소=코인).
   * 기관을 안 골랐으면 <b>이미 들고 있는 보유</b>를 본다 — 금만 있는 자산에서 항목을
   * 추가했는데 주식으로 저장되면 단위가 "주" 로 나오고 유형 분리가 무의미해진다.
   * 둘 다 단서가 없을 때만 주식이다.
   */
  const manualHoldingType = useMemo<HoldingType>(() => {
    if (brandHoldingType !== null) return brandHoldingType;
    const types = new Set(holdings.map((h) => h.holdingType));
    return types.size === 1 ? ([...types][0] ?? "STOCK") : "STOCK";
  }, [brandHoldingType, holdings]);
  const manualAddTypes = useMemo<HoldingType[]>(() => {
    if (brandHoldingType === null) return ["GOLD", "CRYPTO"];
    return brandHoldingType === "STOCK" ? [] : [brandHoldingType];
  }, [brandHoldingType]);

  const brandColor = useMemo(() => {
    if (editingGroup === "card") return cardBrandColor;
    return getBrandColor(brand);
  }, [editingGroup, brand, cardBrandColor]);

  const previewBg = brandColor?.bg ?? item?.color ?? "var(--border-brand)";
  const previewFg = brandColor?.fg ?? "#fff";

  const previewName = (() => {
    const trimmed = name.trim();
    if (trimmed) return trimmed;
    if (editingGroup === "card")
      return selectedCard?.cardName || t("editDialog.newCard");
    if (editingGroup === "invest") return t("editDialog.newInvest");
    return t("editDialog.newAccount");
  })();

  const previewSub = (() => {
    if (editingGroup === "card") {
      const company = cardCompanyName;
      const typeLabel =
        cardType === "CREDIT"
          ? t("assetType.creditcard")
          : t("assetType.checkcard");
      return `${company ? `${company} · ` : ""}${typeLabel}`;
    }
    return t("editDialog.previewSub", { brand });
  })();

  // 별칭 — 길이·중복. 서버에 자산 이름 중복 코드가 없어 여기서 볼 수밖에 없다(QA #16).
  // 카드는 별칭이 선택 입력이라(비우면 카드명으로 폴백) 빈 이름은 계속 허용한다.
  const nameTrim = name.trim();
  const nameIssueKind =
    nameTrim.length === 0
      ? null
      : nameIssue(
          name,
          ASSET_NAME_MAX,
          (assetsData?.assets ?? [])
            .filter((a) => a.rowId !== item?.rowId)
            .map((a) => a.assetName),
        );
  const nameErr =
    nameIssueKind === "tooLong"
      ? t("editDialog.nameTooLong")
      : nameIssueKind === "duplicate"
        ? t("editDialog.nameDuplicate")
        : null;

  // 유효성
  const canSubmit = (() => {
    if (nameErr) return false;
    if (editingGroup === "card") {
      // 신용카드는 결제일 필수 — 없으면 청구 사이클(이용기간·예정액·할부 회차)을
      // 세울 수 없다. asset-full 추가 폼(#323)과 같은 규칙인데 이 다이얼로그만
      // 빠져 있었다. 체크카드는 즉시 출금이라 결제일이 없다.
      if (cardType === "CREDIT" && !paymentDay.trim()) return false;
      // 편집 모드: 카드 카탈로그 재선택 없이 별칭/금액만 바꿀 수 있어야 함
      return isNew ? !!selectedCard : true;
    }
    return (nameTrim.length > 0 || !isNew) && brand.trim().length > 0;
  })();

  const title = (() => {
    const group = t(GROUP_NOUN_KEY[editingGroup]);
    return isNew
      ? t("editDialog.titleAdd", { group })
      : t("editDialog.titleEdit", { group });
  })();

  const nameLabel =
    editingGroup === "invest"
      ? t("editDialog.nameLabelInvest")
      : editingGroup === "card"
        ? t("editDialog.nameLabelCard")
        : t("editDialog.nameLabelAccount");
  const namePlaceholder =
    editingGroup === "invest"
      ? t("editDialog.namePlaceholderInvest")
      : editingGroup === "card"
        ? (selectedCard?.cardName ?? t("editDialog.namePlaceholderCard"))
        : t("editDialog.namePlaceholderAccount");

  const isOverdraft =
    editingGroup === "account" && accountSub === "마이너스통장";
  const balanceLabel =
    editingGroup === "card"
      ? t("editDialog.balanceLabelCard")
      : editingGroup === "invest"
        ? t("editDialog.balanceLabelInvest")
        : isOverdraft
          ? // 마이너스통장은 '잔액' 이 아니라 '쓴 돈' 을 묻는다 — 그래야 양수로 받는다.
            t("editDialog.balanceLabelOverdraft")
          : t("editDialog.balanceLabelAccount");

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    // 칸에는 절대값만 들어온다(부호 키를 막았다) — 부호는 아래에서 종류가 붙인다.
    const parsedBalance = Number(sanitizeAmountInput(balanceStr, MAX_BALANCE));

    if (editingGroup === "card") {
      const type: AssetType =
        cardType === "CREDIT" ? "CREDIT_CARD" : "CHECK_CARD";
      const isCredit = cardType === "CREDIT";
      const resolvedName =
        name.trim() || selectedCard?.cardName || item?.assetName || "카드";
      const catalogId = selectedCard?.rowId ?? item?.cardCatalog?.rowId ?? null;
      const institution =
        selectedCard?.company?.name ?? item?.institution ?? undefined;
      const color = cardBrandColor?.bg ?? item?.color ?? undefined;

      const parsedLimit = creditLimit.trim() ? parseInt(creditLimit, 10) : null;
      const parsedDay = paymentDay.trim() ? parseInt(paymentDay, 10) : null;
      const billingFields = {
        // 한도·결제일은 신용카드에만 있는 개념. 계좌 연결은 둘 다 쓴다 —
        // 신용카드는 결제일 자동이체 대상, 체크카드는 즉시 차감 대상.
        creditLimit: isCredit
          ? Number.isFinite(parsedLimit as number)
            ? parsedLimit
            : null
          : null,
        paymentDay: isCredit
          ? Number.isFinite(parsedDay as number)
            ? parsedDay
            : null
          : null,
        paymentAssetRowId,
      };
      // 체크카드는 잔액을 들지 않는다 — 사용액은 연결 계좌에서 빠져 있다.
      // 신용카드 잔액은 미결제 사용액이라 음수 — 사용자가 양수를 쳐도 뒤집어 보낸다.
      const cardBalance = isCredit ? -Math.abs(parsedBalance) : 0;

      if (isNew) {
        onCreate({
          assetName: resolvedName,
          assetType: type,
          balance: cardBalance,
          currency: "KRW",
          institution,
          color,
          isIncludedInTotal,
          cardCatalogRowId: catalogId,
          ...billingFields,
        });
      } else {
        onUpdate({
          assetName: resolvedName,
          assetType: type,
          balance: cardBalance,
          currency: "KRW",
          institution,
          color,
          memo: memo.trim() || undefined,
          isIncludedInTotal,
          cardCatalogRowId: catalogId,
          ...billingFields,
        });
      }
      return;
    }

    if (editingGroup === "invest") {
      const resolvedName = name.trim() || `${brand} 투자`;
      // holdings 페이로드 — 리스트 전체 교체 계약. linked→tossSymbol+quantity / manual→holdingName+holdingValue.
      // 추가만 하고 아무것도 안 채운 행은 버린다 — 이름이 빈 미연동 항목은 서버가 400 으로 막는다.
      const filledHoldings = holdings.filter(
        (h) => h.linked || (h.holdingName ?? "").trim().length > 0,
      );
      // 미연동도 수량을 함께 보낸다 — 시세가 없어도 몇 주·몇 g 인지는 남긴다(선택 입력).
      // 수량은 숫자로 바꾸지 않고 문자열 그대로 — 서버가 BigDecimal 로 받아 자릿수를 잃지 않는다.
      const holdingsPayload: AssetHolding[] = filledHoldings.map((h, i) => ({
        rowId: h.rowId,
        holdingType: h.holdingType,
        linked: h.linked,
        marketCode: h.linked ? (h.marketCode ?? null) : null,
        tossSymbol: h.linked ? (h.tossSymbol ?? null) : null,
        quantity: h.linked
          ? (normalizeQty(h.quantity) ?? "0")
          : normalizeQty(h.quantity),
        holdingName: h.linked ? null : (h.holdingName ?? ""),
        holdingValue: h.linked ? null : (h.holdingValue ?? 0),
        // 안 적었으면 안 보낸다 — 서버가 같은 종목의 기존 원가를 잇는다.
        totalCost: h.totalCost ?? null,
        sortOrder: i,
      }));
      // 보유가 있으면 balance 를 아예 보내지 않는다 — 서버가 시세×수량을 BigDecimal 로 산정한다.
      // 화면 합계(holdingsTotal)는 미리보기일 뿐 DB 에 남는 금액이 아니다.
      const investBalance =
        filledHoldings.length > 0 ? undefined : parsedBalance;
      const common = {
        assetName: resolvedName,
        assetType: "INVESTMENT" as AssetType,
        balance: investBalance,
        currency: "KRW",
        institution: brand,
        color: brandColor?.bg,
        memo: memo.trim() || undefined,
        isIncludedInTotal,
        holdings: holdingsPayload,
      };
      if (isNew) onCreate(common);
      else onUpdate(common);
      return;
    }

    // account
    const assetType = subToAssetType(accountSub);
    const resolvedName = name.trim() || `${brand} ${accountSub}`;
    // 부호는 종류가 정한다 — 대출·마이너스통장은 빚이라 음수로 저장한다(QA #19).
    // 사용자가 절대값으로 넣은 값을 여기서 뒤집으므로 서버가 옛 버전이어도 값이 맞는다.
    const accountBalance = signedBalanceOf(accountSub, parsedBalance);
    // 약정 한도는 선택 입력. 신용카드 한도와 같은 컬럼을 쓴다(둘 다 '빌릴 수 있는 최대').
    const overdraftLimit = isOverdraft
      ? Number(sanitizeAmountInput(creditLimit, MAX_BALANCE)) || null
      : null;
    const common = {
      assetName: resolvedName,
      assetType,
      balance: accountBalance,
      currency: "KRW",
      institution: brand,
      color: brandColor?.bg,
      memo: memo.trim() || undefined,
      isIncludedInTotal,
      creditLimit: overdraftLimit,
    };
    if (isNew) onCreate(common);
    else onUpdate(common);
  };

  const bodyContent = (
    <Fragment>
      {/* Preview */}
      <div className="flex items-center gap-3">
        {editingGroup === "card" && selectedCard?.imgUrl ? (
          <img
            src={selectedCard.imgUrl}
            alt=""
            className="rounded-[var(--radius-md)] object-cover flex-shrink-0"
            style={{ width: 68, height: 44 }}
          />
        ) : editingGroup === "card" ? (
          <span
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
            style={{
              width: 68,
              height: 44,
              background: previewBg,
              color: previewFg,
            }}
          >
            <CreditCard size={20} />
          </span>
        ) : (
          <AssetLogo
            asset={{
              assetName: previewName,
              institution: brand,
              color: brandColor?.bg ?? item?.color ?? null,
            }}
            size={52}
          />
        )}
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-[var(--fg-primary)] truncate">
            {previewName}
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">
            {previewSub}
          </div>
        </div>
      </div>

      {/* Group별 본문 */}
      {editingGroup === "card" ? (
        <>
          <div>
            <Label className="text-[13px] font-medium mb-2 block">
              {t("editDialog.cardTypeLabel")}
            </Label>
            <Tabs
              value={cardType}
              onValueChange={(v) => {
                if (!v) return;
                setCardType(v as CardType);
                if (isNew) setSelectedCard(null);
              }}
            >
              <TabsList variant="pill" size="sm" className="w-full">
                <TabsTrigger value="CREDIT" className="flex-1">
                  {t("assetType.creditcard")}
                </TabsTrigger>
                <TabsTrigger value="CHECK" className="flex-1">
                  {t("assetType.checkcard")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <SearchableList
            label={t("editDialog.cardProduct")}
            totalCount={catalogQ.data?.meta?.totalElements}
            searchValue={cardKeyword}
            onSearchChange={setCardKeyword}
            placeholder={t("editDialog.cardSearchPlaceholder")}
            isLoading={catalogQ.isLoading}
            loadingSkeleton={
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{
                      borderBottom:
                        i < 4 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <SkeletonBase className="h-7 w-11 rounded-sm shrink-0" />
                    <div className="flex-1 min-w-0">
                      <SkeletonBase className="h-3.5 w-2/3 mb-1.5" />
                      <SkeletonBase className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            }
            headerExtras={
              <label
                className="inline-flex items-center cursor-pointer select-none gap-1.5 text-caption text-text-tertiary"
                title={t("editDialog.includeDiscontinuedTooltip")}
              >
                <Switch
                  checked={includeDiscontinued}
                  onCheckedChange={setIncludeDiscontinued}
                />
                {t("editDialog.includeDiscontinued")}
              </label>
            }
          >
            {catalogItems.map((c) => {
              const active = selectedCard?.rowId === c.rowId;
              const discontinued = c.isDiscontinued === "Y";
              const thumbnail = c.imgUrl ? (
                <img
                  src={c.imgUrl}
                  alt=""
                  className="rounded object-cover"
                  style={{ width: 44, height: 28 }}
                />
              ) : (
                <span
                  className="rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    width: 44,
                    height: 28,
                    background:
                      getBrandColor(c.company?.name)?.bg ??
                      "var(--color-chart-brown)",
                  }}
                >
                  {(c.company?.name ?? c.cardName).slice(0, 1)}
                </span>
              );
              return (
                <SearchableListItem
                  key={c.rowId}
                  active={active}
                  dim={discontinued}
                  onClick={() => setSelectedCard(c)}
                  thumbnail={thumbnail}
                  title={
                    <>
                      <span className="truncate">{c.cardName}</span>
                      {discontinued && (
                        <span
                          className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold flex-shrink-0"
                          style={{
                            background: "var(--bg-disabled)",
                            color: "var(--fg-tertiary)",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {t("editDialog.discontinued")}
                        </span>
                      )}
                    </>
                  }
                  subtitle={
                    <>
                      {c.company?.name ?? "—"} ·{" "}
                      {c.cardType === "CREDIT"
                        ? t("cardTypeShort.credit")
                        : t("cardTypeShort.check")}
                      {/* 연회비 정보가 없으면(null) 좁은 목록에선 생략. 0원이면 '무료'로 구분해 보인다. */}
                      {c.annualFee &&
                        (c.annualFee.amount > 0 ? (
                          <>
                            {" "}
                            ·{" "}
                            {t("editDialog.annualFeeValue", {
                              amount:
                                c.annualFee.amount.toLocaleString("ko-KR"),
                            })}
                          </>
                        ) : (
                          <> · {t("editDialog.annualFeeFree")}</>
                        ))}
                    </>
                  }
                />
              );
            })}
          </SearchableList>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[13px] font-medium">
              {editingGroup === "invest"
                ? t("editDialog.brokerExchange")
                : t("editDialog.institutionBrand")}
            </Label>
            <span className="text-[11px] text-[var(--fg-tertiary)]">
              {t("editDialog.totalCount", {
                count:
                  editingGroup === "invest"
                    ? INVEST_BRANDS.length
                    : BANK_ENTRIES.filter(
                        (e) => !INVEST_CATEGORY_SET.has(e.category),
                      ).length,
              })}
            </span>
          </div>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
            />
            <Input
              search
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                editingGroup === "invest"
                  ? t("editDialog.investSearchPlaceholder")
                  : t("editDialog.bankSearchPlaceholder")
              }
              className="pl-9"
            />
          </div>
          <div
            className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {editingGroup === "invest" ? (
              investFilteredCount === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                  {t("editDialog.noSearchResults")}
                </div>
              ) : (
                <ToggleGroup
                  type="single"
                  value={brand}
                  onValueChange={(v) => v && setBrand(v)}
                  className="block w-full"
                >
                  {investFilteredByCategory.map(([cat, list]) => (
                    <div key={cat}>
                      <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                        {t(CATEGORY_LABEL_KEY[cat])}
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                        {list.map((e) => {
                          const active = e.name === brand;
                          return (
                            <ToggleGroupItem
                              key={e.name}
                              value={e.name}
                              className="rounded-full border text-[12.5px] font-medium h-7 min-w-0 px-3"
                              style={
                                active
                                  ? {
                                      background: e.color.bg,
                                      color: e.color.fg ?? "#fff",
                                      borderColor: "transparent",
                                    }
                                  : {
                                      background: "var(--bg-muted)",
                                      color: "var(--fg-secondary)",
                                      borderColor: "transparent",
                                    }
                              }
                            >
                              {e.name}
                            </ToggleGroupItem>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </ToggleGroup>
              )
            ) : bankFilteredByCategory.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                {t("editDialog.noSearchResults")}
              </div>
            ) : (
              <ToggleGroup
                type="single"
                value={brand}
                onValueChange={(v) => v && setBrand(v)}
                className="block w-full"
              >
                {bankFilteredByCategory.map(([cat, list]) => (
                  <div key={cat}>
                    <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                      {cat}
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {list.map((e) => {
                        const active = e.name === brand;
                        return (
                          <ToggleGroupItem
                            key={e.name}
                            value={e.name}
                            className="rounded-full border text-[12.5px] font-medium h-7 min-w-0 px-3"
                            style={
                              active
                                ? {
                                    background: e.color.bg,
                                    color: e.color.fg ?? "#fff",
                                    borderColor: "transparent",
                                  }
                                : {
                                    background: "var(--bg-muted)",
                                    color: "var(--fg-secondary)",
                                    borderColor: "transparent",
                                  }
                            }
                          >
                            {e.name}
                          </ToggleGroupItem>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </ToggleGroup>
            )}
          </div>
        </div>
      )}

      {editingGroup === "account" && (
        <div>
          <Label className="text-[13px] font-medium mb-2 block">
            {t("editDialog.accountTypeLabel")}
          </Label>
          {/* 종류가 여섯이 되면서 모바일 폭(390)·영어 라벨에서 한 줄에 안 들어간다.
              트랙은 그대로 두고 가로 스크롤만 허용한다 — 넘치면 잘리는 대신 밀린다.
              `w-max min-w-full` 이라 자리가 남으면 예전처럼 꽉 채워 늘어난다. */}
          <div className="overflow-x-auto">
            <Tabs
              value={accountSub}
              onValueChange={(v) => v && setAccountSub(v as typeof accountSub)}
            >
              <TabsList variant="pill" size="sm" className="w-max min-w-full">
                {ACCOUNT_SUBS.map((s) => (
                  <TabsTrigger key={s} value={s} className="flex-1">
                    {t(`accountSub.${ACCOUNT_SUB_KEY[s]}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      <div>
        <Label
          htmlFor="asset-edit-name"
          className="text-[13px] font-medium mb-2 block"
        >
          {nameLabel}
        </Label>
        <Input
          id="asset-edit-name"
          aria-invalid={!!nameErr}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, ASSET_NAME_MAX))}
          placeholder={namePlaceholder}
          maxLength={ASSET_NAME_MAX}
        />
        <NameCounter len={nameTrim.length} max={ASSET_NAME_MAX} err={nameErr} />
      </div>

      {/* 투자 — 보유 종목 편집 (design invest 분기: 검색→연동 추가 / 직접 추가, qty·평가액 인라인 편집) */}
      {editingGroup === "invest" && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <Label className="text-[13px] font-medium">
              {t("holdings.sectionTitle")}
            </Label>
            <span className="num text-[11px] text-[var(--fg-tertiary)]">
              {t("holdings.editSummary", {
                n: holdings.length,
                total: KRW(holdingsTotal),
              })}
            </span>
          </div>
          {allowStock && (
            <div className="relative mb-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
              />
              <Input
                search
                value={stockQ}
                onChange={(e) => setStockQ(e.target.value)}
                placeholder={t("holdings.searchPlaceholder")}
                className="pl-9"
              />
            </div>
          )}
          {allowStock && stockQ.trim().length > 0 && (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] mb-2"
              style={{ maxHeight: 240, overflowY: "auto" }}
            >
              {stockResults.map((s) => (
                <button
                  key={`${s.marketCode}:${s.symbol}`}
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] transition-colors"
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // 시세 게이트 OFF(비구독·토스 미연결)면 연동해도 평가액을 못 구하므로
                    // 검색 결과도 수동 항목으로 추가 — 사용자가 평가액을 직접 입력해 합계에 반영(사용자 결정).
                    setHoldings((prev) => [
                      ...prev,
                      liveEnabled
                        ? {
                            key: nextHoldingKey(),
                            holdingType: "STOCK" as HoldingType,
                            linked: true,
                            // 검색 결과가 시장을 알고 있다 — 여기서 안 담으면 서버는
                            // 심볼로 되짚어야 하고, 여러 시장에 걸리면 확정하지 못한다.
                            marketCode: s.marketCode,
                            tossSymbol: s.symbol,
                            quantity: "1",
                            displayName: s.nameKr,
                          }
                        : {
                            key: nextHoldingKey(),
                            holdingType: manualHoldingType,
                            linked: false,
                            holdingName: s.nameKr,
                            holdingValue: 0,
                          },
                    ]);
                    setStockQ("");
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[var(--fg-primary)]">
                      {s.nameKr}
                    </div>
                    <div className="num text-[11px] text-[var(--fg-tertiary)] mt-0.5">
                      {s.symbol} · {s.marketCode}
                    </div>
                  </div>
                </button>
              ))}
              {stockSearching && stockResults.length === 0 && (
                <div className="py-4 text-center text-[12px] text-[var(--fg-tertiary)]">
                  …
                </div>
              )}
              <button
                type="button"
                className="flex w-full items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-bold text-[var(--fg-brand)]"
                style={{
                  background: "transparent",
                  border: 0,
                  borderTop: stockResults.length
                    ? "1px solid var(--border-subtle)"
                    : "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setHoldings((prev) => [
                    ...prev,
                    {
                      key: nextHoldingKey(),
                      holdingType: manualHoldingType,
                      linked: false,
                      holdingName: stockQ.trim(),
                      holdingValue: 0,
                    },
                  ]);
                  setStockQ("");
                }}
              >
                <Plus size={13} strokeWidth={2.4} />{" "}
                {t("holdings.addManual", { name: stockQ.trim() })}
              </button>
            </div>
          )}
          {/* 금·코인은 검색 대상이 아니다(토스·마스터 모두 미제공) — 직접 추가로만 담는다.
                  기관이 유형을 정하므로 증권사면 아무것도 안 뜬다(주식은 위 검색으로 담는다). */}
          <div className="flex gap-1.5 mb-1">
            {manualAddTypes.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setHoldings((prev) => [
                    ...prev,
                    {
                      key: nextHoldingKey(),
                      holdingType: type,
                      linked: false,
                      holdingName: "",
                      holdingValue: 0,
                    },
                  ])
                }
              >
                <Plus size={13} strokeWidth={2.4} />
                {type === "GOLD"
                  ? t("holdings.addGold")
                  : t("holdings.addCrypto")}
              </Button>
            ))}
          </div>
          {holdings.length === 0 ? (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5 leading-relaxed">
              {allowStock
                ? t("holdings.editEmptyHelp")
                : t("holdings.editEmptyHelpManual")}
            </p>
          ) : (
            <div>
              {HOLDING_TYPES.map(({ type, labelKey }) => {
                const rows = holdings.filter((h) => h.holdingType === type);
                if (rows.length === 0) return null;
                return (
                  <div key={type} className="mt-2 first:mt-0">
                    {/* 유형 라벨과 목록은 한 묶음 — 유형이 하나뿐이어도 어떤 단위인지 드러난다. */}
                    <div className="text-[11px] font-bold text-[var(--fg-tertiary)] pt-1.5">
                      {t(labelKey)}
                    </div>
                    {rows.map((h, i) => {
                      const val = holdingValueOf(h);
                      return (
                        <div
                          key={h.key}
                          className="flex items-center gap-2"
                          style={{
                            padding: "11px 2px",
                            borderTop:
                              i === 0
                                ? "none"
                                : "1px solid var(--border-subtle)",
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            {h.linked ? (
                              <>
                                <div className="text-[13px] font-semibold text-[var(--fg-primary)] truncate">
                                  <LinkedHoldingName holding={h} />
                                  <span
                                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold align-middle"
                                    style={{
                                      background: "var(--bg-brand-subtle)",
                                      color: "var(--fg-brand-strong)",
                                    }}
                                  >
                                    {t("holdings.linkedBadge")}
                                  </span>
                                </div>
                                <div className="num text-[11px] text-[var(--fg-tertiary)] mt-0.5">
                                  {t("holdings.editLinkedSub")}
                                </div>
                              </>
                            ) : (
                              // 미연동은 이름도 고칠 수 있어야 한다 — 금·코인은 검색으로 이름을 받지 못한다.
                              <Input
                                value={h.holdingName ?? ""}
                                placeholder={t("holdings.namePlaceholder")}
                                onChange={(e) =>
                                  setHoldings((prev) =>
                                    prev.map((x) =>
                                      x.key === h.key
                                        ? { ...x, holdingName: e.target.value }
                                        : x,
                                    ),
                                  )
                                }
                                className="h-[34px]"
                              />
                            )}
                            {/* 매수원가 — 실현손익의 기준. 매수·매도로 쌓이지만
                                    앱을 쓰기 전부터 갖고 있던 보유는 여기서 적어 넣어야 손익이 맞는다. */}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="text-[11px] text-[var(--fg-tertiary)] shrink-0">
                                {t("holdings.totalCost")}
                              </span>
                              <Input
                                inputMode="numeric"
                                onKeyDown={blockNonDigitKey}
                                value={
                                  h.totalCost != null ? String(h.totalCost) : ""
                                }
                                placeholder="0"
                                onChange={(e) => {
                                  const v =
                                    parseInt(
                                      e.target.value.replace(/[^\d]/g, ""),
                                      10,
                                    ) || 0;
                                  setHoldings((prev) =>
                                    prev.map((x) =>
                                      x.key === h.key
                                        ? { ...x, totalCost: v }
                                        : x,
                                    ),
                                  );
                                }}
                                className="num h-[28px] w-[104px] px-2 text-right"
                              />
                              {h.totalCost != null &&
                              h.totalCost > 0 &&
                              qtyNumber(h.quantity) ? (
                                <span className="num text-[11px] text-[var(--fg-tertiary)]">
                                  {t("holdings.avgPriceInline", {
                                    avg: KRW(
                                      Math.round(
                                        h.totalCost /
                                          (qtyNumber(h.quantity) || 1),
                                      ),
                                    ),
                                  })}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {/* 수량 — 연동은 필수(시세×수량), 미연동은 선택. 소수 허용(0.05 BTC·3.75g) */}
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Input
                              inputMode="decimal"
                              value={h.quantity ?? ""}
                              onChange={(e) => {
                                const q = sanitizeQty(e.target.value);
                                setHoldings((prev) =>
                                  prev.map((x) =>
                                    x.key === h.key ? { ...x, quantity: q } : x,
                                  ),
                                );
                              }}
                              className="num h-[34px] w-[62px] px-2 text-right"
                            />
                            <span className="text-[12px] text-[var(--fg-tertiary)]">
                              {t(HOLDING_UNIT_KEY[h.holdingType])}
                            </span>
                          </span>
                          {/* 평가액 — 연동은 시세로 계산(읽기 전용), 미연동은 직접 입력 */}
                          {h.linked ? (
                            <span
                              className="num shrink-0 text-right text-[12.5px] font-bold text-[var(--fg-primary)]"
                              style={{ minWidth: 84 }}
                            >
                              {val != null ? `${KRW(val)}원` : "—"}
                            </span>
                          ) : (
                            <Input
                              inputMode="numeric"
                              onKeyDown={blockNonDigitKey}
                              value={
                                h.holdingValue != null
                                  ? String(h.holdingValue)
                                  : ""
                              }
                              onChange={(e) => {
                                const v =
                                  parseInt(
                                    e.target.value.replace(/[^\d]/g, ""),
                                    10,
                                  ) || 0;
                                setHoldings((prev) =>
                                  prev.map((x) =>
                                    x.key === h.key
                                      ? { ...x, holdingValue: v }
                                      : x,
                                  ),
                                );
                              }}
                              className="num h-[34px] w-[100px] px-2 text-right shrink-0"
                            />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8"
                            aria-label={t("holdings.remove")}
                            onClick={() =>
                              setHoldings((prev) =>
                                prev.filter((x) => x.key !== h.key),
                              )
                            }
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 신용카드 — design 신판 순서: 신용한도 → 결제일 → 현재 사용액 → 결제 계좌(연동 유지) */}
      {editingGroup === "card" && cardType === "CREDIT" && (
        <>
          <div>
            <Label
              htmlFor="card-credit-limit"
              className="text-[13px] font-medium mb-2 block"
            >
              {t("editDialog.creditLimit")}
            </Label>
            <Input
              id="card-credit-limit"
              inputMode="numeric"
              value={creditLimit}
              onChange={(e) =>
                setCreditLimit(sanitizeAmountInput(e.target.value, MAX_BALANCE))
              }
              onKeyDown={blockNonDigitKey}
              placeholder={t("editDialog.creditLimitPlaceholder")}
            />
          </div>
          <div>
            <Label className="text-[13px] font-medium mb-2 block">
              {t("editDialog.paymentDay")}
            </Label>
            <Select
              value={paymentDay || undefined}
              onValueChange={(v) => setPaymentDay(v)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("editDialog.paymentDayPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {t("editDialog.dayUnit", { day: d })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* 마이너스통장 약정 한도 — 선택 입력. 신용카드 한도와 같은 credit_limit 컬럼을 쓴다
          (둘 다 '빌릴 수 있는 최대'). 한도 게이지는 신용카드에서만 그리므로 겸용해도 부딪히지 않는다. */}
      {isOverdraft && (
        <div>
          <Label
            htmlFor="overdraft-limit"
            className="text-[13px] font-medium mb-2 block"
          >
            {t("editDialog.overdraftLimitLabel")}
          </Label>
          <Input
            id="overdraft-limit"
            inputMode="numeric"
            value={creditLimit}
            onChange={(e) =>
              setCreditLimit(sanitizeAmountInput(e.target.value, MAX_BALANCE))
            }
            onKeyDown={blockNonDigitKey}
            placeholder="0"
          />
        </div>
      )}

      {/* 체크카드는 잔액 개념이 없다 — 긁는 즉시 연결 계좌에서 빠지므로 카드가 들고 있을 금액이 없다.
              신용카드는 결제일까지 사용액을 들고 있으므로 그대로 입력받는다. */}
      {editingGroup === "card" && cardType === "CHECK" ? null : editingGroup ===
          "invest" && holdings.length > 0 ? (
        <div>
          <Label className="text-[13px] font-medium mb-2 block">
            {balanceLabel}
          </Label>
          <div className="num rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2.5 text-[14px] font-bold text-[var(--fg-primary)]">
            {KRW(holdingsTotal)}원
          </div>
          <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
            {t("holdings.balanceAutoHelp")}
          </p>
        </div>
      ) : (
        <div>
          <Label
            htmlFor="asset-edit-balance"
            className="text-[13px] font-medium mb-2 block"
          >
            {balanceLabel}
          </Label>
          <Input
            id="asset-edit-balance"
            inputMode="numeric"
            value={balanceStr}
            onChange={(e) =>
              setBalanceStr(sanitizeAmountInput(e.target.value, MAX_BALANCE))
            }
            // `-` 도 여기서 막힌다 — 부호는 종류가 정한다(QA #19).
            onKeyDown={blockNonDigitKey}
            onBlur={() => {
              const n = Number(balanceStr) || 0;
              setBalanceStr(n ? KRW(n) : "0");
            }}
            onFocus={() =>
              setBalanceStr((prev) => {
                const bare = prev.replace(/,/g, "");
                // 기본값 `0` 은 지우고 시작한다 — 안 지우면 500 을 쳐서 0500 이 된다(QA #18).
                // 아무것도 안 치고 나가면 위 onBlur 가 다시 `0` 으로 되돌린다.
                return bare === "0" ? "" : bare;
              })
            }
          />
          {editingGroup === "card" && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.cardBalanceHelp")}
            </p>
          )}
          {isOverdraft && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.overdraftHelp")}
            </p>
          )}
          {/* 잔액 수동 수정 = 새 앵커. 그 시각 이전 내역은 이 잔액에 이미 들어 있는 것으로 보고
              이후 내역만 더해진다 — 모르고 고치면 방금 한 이체가 잔액에서 사라진 것처럼 보인다. */}
          {item && editingGroup !== "card" && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.balanceEditHelp")}
            </p>
          )}
        </div>
      )}

      {/* 신용카드는 결제일에 여기서 한 번에 빠지고, 체크카드는 긁는 즉시 빠진다 — 의미가 달라 라벨을 나눈다. */}
      {editingGroup === "card" && (
        <div>
          <Label className="text-[13px] font-medium mb-2 block">
            {cardType === "CHECK"
              ? t("editDialog.linkedAccount")
              : t("editDialog.paymentAccount")}
          </Label>
          <Select
            value={
              paymentAssetRowId != null ? String(paymentAssetRowId) : undefined
            }
            onValueChange={(v) => setPaymentAssetRowId(v ? Number(v) : null)}
            disabled={bankAccounts.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  bankAccounts.length === 0
                    ? t("editDialog.noCheckingAccount")
                    : cardType === "CHECK"
                      ? t("editDialog.selectLinkedAccount")
                      : t("editDialog.selectPaymentAccount")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((a) => (
                <SelectItem key={a.rowId} value={String(a.rowId)}>
                  {a.institution
                    ? `${a.institution} · ${a.assetName}`
                    : a.assetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cardType === "CHECK" && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.linkedAccountHelp")}
            </p>
          )}
        </div>
      )}

      {editingGroup !== "card" && (
        <div>
          <Label
            htmlFor="asset-edit-memo"
            className="text-[13px] font-medium mb-2 block"
          >
            {t("editDialog.memoOptional")}
          </Label>
          <Input
            id="asset-edit-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={t("editDialog.memoPlaceholder")}
            maxLength={120}
          />
        </div>
      )}

      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted text-[var(--fg-secondary)]">
          <Wallet size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--fg-primary)]">
            {t("editDialog.includeInTotal")}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[var(--fg-secondary)]">
            {t("editDialog.includeInTotalDesc")}
          </div>
        </div>
        <Switch
          checked={isIncludedInTotal === "Y"}
          onCheckedChange={(b) => setIsIncludedInTotal(b ? "Y" : "N")}
        />
      </div>
    </Fragment>
  );

  // 어느 폭에서든 [취소][저장] — 삭제는 상세로 옮겼다
  // (spec drawer.md: 상세 = 삭제·편집 / 편집 폼 = 취소·저장).
  const footerInner = (
    <ModalFooter
      onSave={handleSubmit}
      saveLabel={isNew ? t("addAction") : tCommon("save")}
      saving={isSubmitting}
      saveDisabled={!canSubmit}
      onCancel={handleClose}
      cancelLabel={tCommon("cancel")}
    />
  );

  return (
    <ModalShell
      title={title}
      onClose={handleClose}
      mobile={mobile}
      size="md"
      // ModalShell 이 footer 컨테이너를 쥔다 — 감싸면 안 된다. 모바일 균등분배가
      // `[&>button]:flex-1`(직계 자식) 이라 div 를 한 겹 끼우면 버튼이 손자가 돼
      // 선택자에서 빠지고, 데스크탑도 컨테이너의 justify-end 대신 그 div 의 배치를
      // 따른다. 다른 다이얼로그처럼 footer 를 그대로 넘긴다.
      footer={footerInner}
    >
      <div className="flex flex-col gap-5">{bodyContent}</div>
    </ModalShell>
  );
}
