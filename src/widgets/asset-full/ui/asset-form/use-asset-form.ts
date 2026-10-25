import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAssets } from "@/features/asset";
import { useDefaultCurrency } from "@/features/user";
import { KRW } from "@/shared/lib/groo/format";
import { todayLocalKey } from "@/shared/lib/date";
import { pendingBillWindow } from "@/entities/expense";
import { parseAmount } from "@/shared/lib/groo/amount";
import { currencyUnit, isForeignCurrency } from "@/shared/lib/groo/currency";
import { nameIssue } from "@/shared/lib/groo/name-policy";
import { assetTypeToSub, type AccountSub } from "../../lib/account-sub";
import {
  getBrandColor,
  BANK_ENTRIES,
  BANK_ENTRIES_BY_CATEGORY,
  BANK_CATEGORY_ORDER,
  INVEST_CATEGORIES,
  CATEGORY_HOLDING_TYPE,
  type BankCategory,
  type BankEntry,
} from "@/shared/lib/groo/bank-colors";
import { useCardCatalogs } from "@/features/card-catalog";
import type { CardCatalogSummary, CardType } from "@/entities/card";
import { type Asset, type HoldingType, qtyNumber } from "@/entities/asset";
import type { YNType } from "@/shared/types";
import { useStockSearch } from "@/features/stock/model/useStockMaster";
import { useLivePrices } from "@/features/stock/model/useLivePrices";
import { useMyFeatures } from "@/features/subscription/model/useSubscription";
import {
  INVEST_CATEGORY_SET,
  type AssetGroup,
  type EditHolding,
  nextHoldingKey,
  ASSET_NAME_MAX,
  trimRate,
  GROUP_NOUN_KEY,
  groupOfType,
  INVEST_BRANDS,
  cardSummaryOf,
} from "./form-lib";

export interface UseAssetFormArgs {
  item: Asset | null;
  group: AssetGroup;
}

/** 검색 입력 디바운스 — 키 입력마다 서버 검색이 나가지 않게 한다. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useAssetForm({ item, group }: UseAssetFormArgs) {
  const uid = useId(); // 선택 칸 이름 잇기 — 보이는 라벨 + 값을 aria-labelledby 로
  const { t, i18n } = useTranslation("asset");
  const { t: tCommon } = useTranslation("common");
  const isNew = !item;
  const editingGroup: AssetGroup = item ? groupOfType(item.assetType) : group;

  // 설정의 기본 통화 — 새 자산이 먼저 골라 두는 값이다(D7).
  const defaultCurrency = useDefaultCurrency();

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
  // 새 자산은 가리지 않는다 — 만들자마자 금액이 안 보이면 잘못 만든 줄 안다.
  const [isAmountHidden, setIsAmountHidden] = useState<YNType>(
    item?.isAmountHidden ?? "N",
  );
  // 숨김을 **푸는** 쪽에만 본인 확인을 건다 — 켜는 건 그냥 된다(카드 가리기·상세 토글과
  // 같은 규칙). 모바일은 상세에 토글이 없어 이 폼이 유일한 해제 경로다. 여기에 확인이
  // 없으면 "풀 때는 비밀번호" 규칙 자체가 없는 것과 같다(QA 22차 #2).
  const needsUnlock =
    !isNew && item?.isAmountHidden === "Y" && isAmountHidden === "N";
  const [unlockOpen, setUnlockOpen] = useState(false);
  // state 가 아니라 ref 다 — 확인창의 `onVerified` 에서 곧바로 `handleSubmit()` 을
  // 다시 부르는데, setState 로 두면 그 호출이 아직 `false` 인 값을 읽는다.
  const unlockedRef = useRef(false);
  // 절대값으로 보여 준다 — 부호는 종류가 정하므로 칸에 `-` 가 남아 있을 이유가 없다(QA #19).
  //
  // 신용카드는 이 칸이 **이월 금액**(카드를 등록할 때 적은 이전 미결제 사용액)이다(D7).
  // 지금 잔액(이월 + 그 뒤 사용)으로 채우면 이름만 고쳐 저장해도 서버가 그 값을 이월로
  // 받아 빚이 두 배가 됐다(QA 23차 1). 이월이 없으면 0 이다.
  const [balanceStr, setBalanceStr] = useState<string>(
    item
      ? KRW(
          Math.abs(
            (item.assetType === "CREDIT_CARD"
              ? item.carryoverAmount
              : item.balance) ?? 0,
          ),
        )
      : "0",
  );
  /**
   * 신용카드의 결제 대기 청구분 칸(2026-09-22) — 기존 카드는 서버가 준 값으로 연다. 칸이 없으면
   * 쓰지 않는다(`dueField` 가 정한다).
   */
  const [dueStr, setDueStr] = useState<string>(
    item?.assetType === "CREDIT_CARD" && item.dueCarryover
      ? KRW(Math.abs(item.dueCarryover.amount))
      : "0",
  );
  /**
   * 결제일을 바꿀 때 한 번 받는 확인(D5). state 가 아니라 ref 다 — 확인창의
   * `onConfirm` 에서 곧바로 `handleSubmit()` 을 다시 부르는데, setState 로 두면 그 호출이
   * 아직 `false` 인 값을 읽는다(금액 숨김 해제 확인과 같은 자리).
   */
  const paymentDayConfirmedRef = useRef(false);
  const [paymentDayConfirm, setPaymentDayConfirm] = useState<string | null>(
    null,
  );

  // 통화·환율 — 세 묶음(계좌·카드·투자) 모두에 칸이 있다(D1).
  //
  // **읽어 온 값으로 연다.** 이게 이 칸의 안전장치다 — 안 채우고 열면 그대로 저장하는
  // 것만으로 외화 자산이 원화가 된다. 칸이 생겨서 오히려 위험해지는 자리라, 앱도
  // 같은 순서로 잠갔다(desk-app #330).
  //
  // **새로 만들 때만** 설정의 기본 통화가 들어온다(D7 · QA #124). 기존 자산에까지
  // 쓰면 기본 통화를 USD 로 바꾼 순간 원화 계좌들이 전부 USD 로 열리고, 그대로 저장만
  // 해도 통화가 바뀐다 — 고치라고 만든 칸이 고장을 내는 쪽이다.
  const [currencyPick, setCurrency] = useState<string | null>(null);
  // 우선순위는 **고른 값 > 이 자산의 값 > 설정의 기본 통화**다.
  //
  // 기본 통화를 `useState` 초기값으로 굳히면 안 된다(D7) — `/me/preferences` 는 설정
  // 화면을 안 들른 세션에서 이 폼보다 늦게 도착해서, 초기값으로 받으면 첫 렌더의
  // `KRW` 에 잠긴 채 열린다. 매 렌더 읽어야 늦게 온 값이 반영된다.
  const currency = currencyPick ?? item?.currency ?? defaultCurrency;
  const [exchangeRate, setExchangeRate] = useState<string>(
    item?.exchangeRate != null ? trimRate(item.exchangeRate) : "",
  );
  // 환율은 통화가 원화가 아닐 때만 의미가 있다 — 서버도 KRW 의 환산율은 1 로
  // 정규화한다(`Asset.normalizeRate`). 칸을 숨길 뿐 값은 들고 있는다:
  // 통화를 잘못 눌렀다 되돌렸을 때 적어 둔 환율이 사라지면 곤란하다.
  const isForeign = isForeignCurrency(currency);

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
    () => getBrandColor(cardCompanyName),
    [cardCompanyName],
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
  /**
   * 금액 칸의 단위는 **고른 통화**를 따른다. 라벨에 `(원)` 이 박혀 있어 USD 를 골라도
   * 원화처럼 보였다(QA 12차) — 잔액도 한도도 이 폼의 통화로 적는 값이다
   * (초과 안내가 이미 `formatOriginalAmount(…, currency)` 로 나간다).
   *
   * 표기 규칙은 `currencyUnit` 한 곳에 있다 — 앱도 같은 규칙을 쓴다.
   */
  const unit = currencyUnit(currency);
  const balanceLabel =
    editingGroup === "card"
      ? t("editDialog.balanceLabelCard", { unit })
      : editingGroup === "invest"
        ? t("editDialog.balanceLabelInvest", { unit })
        : isOverdraft
          ? // 마이너스통장은 '잔액' 이 아니라 '쓴 돈' 을 묻는다 — 그래야 양수로 받는다.
            t("editDialog.balanceLabelOverdraft", { unit })
          : t("editDialog.balanceLabelAccount", { unit });

  /**
   * 한도 초과 — **저장은 막지 않는다**(사용자 결정, QA #125). 넘겼다는 사실만 보인다.
   *
   * 서버 검사도 넣지 않는다. 한도는 카드사·은행이 정하는 값이고 우리가 아는 건
   * 사용자가 적어 둔 숫자다 — 막아 버리면 실제로 한도를 올린 사람이 사용액을 못 고친다.
   * 반대로 조용히 넘어가면 한도를 잘못 적어 둔 걸 아무도 모르므로, 화면에만 세운다.
   *
   * 신용카드 사용액과 마이너스통장 사용액이 같은 `credit_limit` 을 쓰므로 두 자리가
   * 같은 문구를 쓴다. 한도를 안 적었으면(0) 견줄 값이 없어 아무 말도 안 한다.
   */
  const isCreditCardEdit = editingGroup === "card" && cardType === "CREDIT";
  /** 신용카드로 저장돼 있던 자산을 고치는 중 — 이월 금액·결제일 규칙이 여기에만 걸린다. */
  const isExistingCreditCard =
    !isNew && item?.assetType === "CREDIT_CARD" && isCreditCardEdit;
  /** 이월 거래가 든 회차의 결제일이 됐다 — 이월 금액 칸은 읽기 전용이다(D15). */
  const carryoverLocked =
    isExistingCreditCard && item?.carryoverLocked === true;
  /** 지금 미결제 잔액 — 이월 칸 옆에 읽기 전용으로 둔다(D7). 선결제로 남은 돈은 0 이다. */
  const currentUnpaid = isExistingCreditCard
    ? Math.max(0, -(item?.balance ?? 0))
    : 0;
  /**
   * 결제 대기 청구분 칸(2026-09-22 사용자 결정). 결제일 전에 카드를 등록하면 실제 카드사는
   * 지난달 청구분을 다가오는 결제일에, 이번 달 쓴 금액을 그다음 결제일에 뺀다 — 한 칸으로
   * 받으면 전부 다음 달에 빠져 한 달 동안 통장 잔액이 실제보다 많았다. 그래서 두 칸으로 받는다.
   *  - 새 카드: 오늘이 이번 달 결제일 전이면 연다(결제일을 바꾸면 따라 바뀐다)
   *  - 기존 카드: 서버가 칸을 줄 때만 — 청구분이 있거나 등록한 달의 그 회차가 아직 열려 있을 때.
   *    그 회차 결제일이 되면 잠긴다(D15 와 같다)
   */
  const newCardBillWindow =
    isNew && isCreditCardEdit
      ? pendingBillWindow(
          todayLocalKey(),
          paymentDay.trim() ? parseInt(paymentDay, 10) : null,
        )
      : null;
  const dueField: { paymentDate: string; locked: boolean } | null =
    newCardBillWindow
      ? { paymentDate: newCardBillWindow.dueDate, locked: false }
      : isExistingCreditCard && item?.dueCarryover?.paymentDate
        ? {
            paymentDate: item.dueCarryover.paymentDate,
            locked: item.dueCarryover.locked === true,
          }
        : null;
  const dueAmount = dueField ? parseAmount(dueStr) : 0;
  const limitAmount =
    isCreditCardEdit || isOverdraft ? parseAmount(creditLimit) : 0;
  /**
   * 한도와 견줄 사용액. 기존 신용카드는 칸이 이월 금액이라 칸 값만으로는 사용액이 아니다 —
   * 지금 미결제 잔액에서 이월을 고친 만큼을 더하고 뺀 값이 저장 뒤 사용액이다.
   */
  const usageForLimit = isExistingCreditCard
    ? Math.max(
        0,
        currentUnpaid -
          Math.abs(item?.carryoverAmount ?? 0) +
          parseAmount(balanceStr) -
          Math.abs(item?.dueCarryover?.amount ?? 0) +
          dueAmount,
      )
    : parseAmount(balanceStr) + dueAmount;
  const overLimitBy =
    limitAmount > 0 ? Math.max(0, usageForLimit - limitAmount) : 0;

  return {
    item,
    group,
    uid,
    t,
    i18n,
    tCommon,
    isNew,
    editingGroup,
    defaultCurrency,
    brand,
    setBrand,
    query,
    setQuery,
    name,
    setName,
    memo,
    setMemo,
    isIncludedInTotal,
    setIsIncludedInTotal,
    isAmountHidden,
    setIsAmountHidden,
    needsUnlock,
    unlockOpen,
    setUnlockOpen,
    unlockedRef,
    balanceStr,
    setBalanceStr,
    dueStr,
    setDueStr,
    paymentDayConfirmedRef,
    paymentDayConfirm,
    setPaymentDayConfirm,
    currencyPick,
    setCurrency,
    currency,
    exchangeRate,
    setExchangeRate,
    isForeign,
    accountSub,
    setAccountSub,
    holdings,
    setHoldings,
    stockQ,
    setStockQ,
    debouncedStockQ,
    features,
    liveEnabled,
    stockMatches,
    stockSearching,
    stockResults,
    holdingSymbols,
    priceActive,
    activeHoldingSymbols,
    live,
    holdingValueOf,
    holdingsTotal,
    cardType,
    setCardType,
    cardKeyword,
    setCardKeyword,
    includeDiscontinued,
    setIncludeDiscontinued,
    selectedCard,
    setSelectedCard,
    creditLimit,
    setCreditLimit,
    paymentDay,
    setPaymentDay,
    paymentAssetRowId,
    setPaymentAssetRowId,
    assetsData,
    bankAccounts,
    catalogQ,
    catalogItems,
    matchesQuery,
    bankFilteredByCategory,
    investFilteredByCategory,
    investFilteredCount,
    cardCompanyName,
    cardBrandColor,
    brandHoldingType,
    allowStock,
    manualHoldingType,
    manualAddTypes,
    brandColor,
    previewBg,
    previewFg,
    previewName,
    previewSub,
    nameTrim,
    nameIssueKind,
    nameErr,
    canSubmit,
    title,
    nameLabel,
    namePlaceholder,
    isOverdraft,
    unit,
    balanceLabel,
    isCreditCardEdit,
    isExistingCreditCard,
    carryoverLocked,
    currentUnpaid,
    newCardBillWindow,
    dueField,
    dueAmount,
    limitAmount,
    usageForLimit,
    overLimitBy,
  };
}

export type AssetForm = ReturnType<typeof useAssetForm>;
