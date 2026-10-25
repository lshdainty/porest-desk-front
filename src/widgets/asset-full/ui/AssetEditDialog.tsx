import { Fragment } from "react";
import { ConfirmDialog, ModalShell } from "@/shared/ui/groo/dialogs";
import { HideAmountsUnlockDialog } from "@/widgets/account-settings/ui/HideAmountsUnlockDialog";
import { ModalFooter } from "@/shared/ui/groo/modal-footer";
import { formatDay } from "@/shared/lib/groo/format";
import { formatMonthShort, todayLocalKey } from "@/shared/lib/date";
import { pendingCycleOnOldDay } from "@/entities/expense";
import { MAX_BALANCE, sanitizeAmountInput } from "@/shared/lib/groo/amount";
import { signedBalanceOf, subToAssetType } from "../lib/account-sub";
import {
  type Asset,
  type AssetFormValues,
  type AssetHolding,
  normalizeQty,
  type AssetType,
  type AssetUpdateFormValues,
} from "@/entities/asset";
import { type AssetGroup } from "./asset-form/form-lib";
import { useAssetForm } from "./asset-form/use-asset-form";
import { PreviewTile } from "./asset-form/PreviewTile";
import { AccountFields } from "./asset-form/AccountFields";
import { CardFields } from "./asset-form/CardFields";
import { InvestFields } from "./asset-form/InvestFields";

export type { AssetGroup };

export interface AssetEditDialogProps {
  item: Asset | null;
  group: AssetGroup;
  onClose: () => void;
  onCreate: (values: AssetFormValues) => void;
  onUpdate: (values: AssetUpdateFormValues) => void;
  mobile: boolean;
  isSubmitting?: boolean;
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
  const f = useAssetForm({ item, group });
  const {
    t,
    tCommon,
    isNew,
    editingGroup,
    brand,
    name,
    memo,
    isIncludedInTotal,
    isAmountHidden,
    needsUnlock,
    unlockOpen,
    setUnlockOpen,
    unlockedRef,
    balanceStr,
    paymentDayConfirmedRef,
    paymentDayConfirm,
    setPaymentDayConfirm,
    currency,
    exchangeRate,
    isForeign,
    accountSub,
    holdings,
    cardType,
    selectedCard,
    creditLimit,
    paymentDay,
    paymentAssetRowId,
    cardBrandColor,
    brandColor,
    canSubmit,
    title,
    isOverdraft,
    isExistingCreditCard,
    carryoverLocked,
    dueField,
    dueAmount,
  } = f;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  /**
   * 저장 본문을 만든다.
   *
   * <b>규칙 하나로 간다 — 이 화면이 가진 칸만 싣는다.</b> PUT 은 세 갈래다
   * (`Patch`: 키 없음=유지 · `null`=지움 · 값=교체, QA #96).
   * - 칸이 **있으면** 그 칸의 지금 상태를 그대로 싣는다. 비어 있으면 `null` 이다 —
   *   사용자가 지운 것이므로 지워져야 한다(메모).
   * - 칸이 **없으면** 지어낸 값을 싣지 않는다. 고를 자리가 없는데 값을 만들어 보내면
   *   다른 화면이 정한 값을 덮는다. 다만 **읽어 온 값을 들고 있는** 칸은
   *   그대로 되돌려 보낸다 — 지어낸 값이 아니라 그 자산의 지금 값이다(카드의 메모).
   *
   * 통화가 그 사고였다(QA #106). 칸도 없이 `"KRW"` 를 실어 보내, 외화로 만든 자산을
   * 한 번 편집하면 원화가 되고 서버가 환산율까지 1 로 정규화해(`Asset.normalizeRate`)
   * 총자산이 환산 없이 합쳐졌다. 되돌릴 입력칸도 없었다 — 그래서 키를 뺐다.
   *
   * **이제 통화는 이 화면의 칸이다**(D1). 세 묶음 모두 지금 통화를 읽어 와 보여 주므로
   * 그대로 실어도 값이 안 바뀌고, 바꿨으면 바꾼 대로 나간다. 환율은 원화로 되돌릴 때
   * **명시적 `null`** 로 지운다 — 키를 빼면 서버가 옛 환율을 지켜 원화 잔액이 1380 배가
   * 된다. 앱도 같은 자리·같은 규칙이다(desk-app #330).
   */
  const handleSubmit = () => {
    if (!canSubmit) return;
    if (needsUnlock && !unlockedRef.current) {
      setUnlockOpen(true);
      return;
    }
    // 결제일을 바꾸면 바로 적용되지 않는다 — 아직 결제 전인 회차는 옛 결제일에 결제되고
    // 그 다음 회차부터 새 결제일이다(D5). 모르고 바꾸면 이번 달 결제가 안 나간 줄 안다.
    const oldDay = item?.paymentDay ?? null;
    const newDay = paymentDay.trim() ? parseInt(paymentDay, 10) : null;
    if (
      isExistingCreditCard &&
      oldDay != null &&
      newDay != null &&
      newDay !== oldDay &&
      !paymentDayConfirmedRef.current
    ) {
      // 서버가 그 회차의 실제 결제일(`nextPaymentDate`, 결제일 이력 반영)을 주면 그 값을 쓴다 —
      // 결제일을 한 번 바꿔 둔 채 또 바꾸면 지금 결제일로 센 날짜가 틀린다(QA 26차 4).
      const pending = pendingCycleOnOldDay(
        oldDay,
        item?.cardClosedThrough,
        todayLocalKey(),
        item?.nextPaymentDate,
      );
      const month = Number(pending.month.slice(5, 7));
      setPaymentDayConfirm(
        t("editDialog.paymentDayChangeConfirm", {
          month,
          monthName: formatMonthShort(month),
          oldDate: formatDay(pending.paymentDate).md,
        }),
      );
      return;
    }
    // 칸에는 절대값만 들어온다(부호 키를 막았다) — 부호는 아래에서 종류가 붙인다.
    const parsedBalance = Number(sanitizeAmountInput(balanceStr, MAX_BALANCE));
    // 통화·환율은 세 묶음이 똑같이 싣는다. 환율은 외화일 때만 값이 있고,
    // 원화로 되돌리면 `null` 로 나가 서버에 남은 옛 환율을 지운다.
    //
    // 자릿수 쉼표는 떼고 읽는다 — 금액 칸에서 `1,380` 을 보고 온 사람이 환율에도
    // 쉼표를 찍는다. `Number("1,380")` 은 `NaN` 이라 조용히 `null` 로 빠지고,
    // 그러면 서버가 환산율 1 로 잡아 외화 잔액이 원화로 그대로 더해진다.
    // 앱도 같은 자리에서 쉼표를 뗀다(desk-app #330).
    const currencyFields = {
      currency,
      exchangeRate: isForeign
        ? Number(exchangeRate.replace(/,/g, "")) || null
        : null,
    };

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
      /**
       * 수정의 금액 칸 — 신용카드는 `balance` 를 **안 싣는다**. 서버가 신용카드 PUT 의
       * balance 를 무시하고(옛 앱이 보내도 무해하게), 이월 금액은 전용 키로만 받는다(D7).
       * 이월 회차가 닫혔으면(D15) 칸이 잠겨 값이 같으므로 키째 뺀다(없으면 유지).
       * 체크카드는 종전대로 0 이다.
       */
      const cardAmountField = isCredit
        ? carryoverLocked
          ? {}
          : { carryoverAmount: Math.abs(parsedBalance) }
        : { balance: cardBalance };
      /**
       * 결제 대기 청구분 — 칸이 있을 때만 싣는다. 새 카드는 0 이면 안 싣고(없음), 수정은 잠기지
       * 않았으면 0 도 싣는다(지운다). 잠겼으면 키째 뺀다(없으면 유지).
       */
      const dueCreateField =
        isCredit && dueField && dueAmount > 0
          ? { dueCarryoverAmount: dueAmount }
          : {};
      const dueUpdateField =
        isCredit && dueField && !dueField.locked
          ? { dueCarryoverAmount: dueAmount }
          : {};

      if (isNew) {
        onCreate({
          assetName: resolvedName,
          assetType: type,
          balance: cardBalance,
          institution,
          color,
          ...currencyFields,
          isIncludedInTotal,
          isAmountHidden,
          cardCatalogRowId: catalogId,
          ...billingFields,
          ...dueCreateField,
        });
      } else {
        onUpdate({
          assetName: resolvedName,
          assetType: type,
          ...cardAmountField,
          ...dueUpdateField,
          institution,
          color,
          ...currencyFields,
          // 카드 묶음은 메모 칸을 안 그린다(입력은 `editingGroup !== "card"` 안에 있다).
          // 그래도 키를 싣는 건 `memo` 상태가 이 자산의 서버 값에서 출발하기 때문이다 —
          // 그대로 되돌려 보내면 카드에선 아무것도 안 바뀌고, 운영에 아직 남아 있는
          // 옛 서버(이 칸을 무조건 대입한다)에서도 남이 적어 둔 메모가 안 지워진다.
          memo: memo.trim() || null,
          isIncludedInTotal,
          isAmountHidden,
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
        institution: brand,
        color: brandColor?.bg,
        ...currencyFields,
        memo: memo.trim() || null,
        isIncludedInTotal,
        isAmountHidden,
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
      institution: brand,
      color: brandColor?.bg,
      ...currencyFields,
      memo: memo.trim() || null,
      isIncludedInTotal,
      isAmountHidden,
      creditLimit: overdraftLimit,
    };
    if (isNew) onCreate(common);
    else onUpdate(common);
  };

  const bodyContent = (
    <Fragment>
      <PreviewTile f={f} />
      {editingGroup === "card" ? (
        <CardFields f={f} />
      ) : editingGroup === "invest" ? (
        <InvestFields f={f} />
      ) : (
        <AccountFields f={f} />
      )}
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
    <>
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
      {/* 확인을 취소하면 저장도 하지 않는다 — 폼 스위치는 끈 채로 남고, 창을 닫으면
        서버 값(숨김)이 그대로다. */}
      {/* 열릴 때만 마운트한다 — 이 창은 비밀번호 확인 훅을 물고 있어, 늘 매달아 두면
        편집 폼을 그리는 모든 자리(테스트 포함)가 그 훅까지 갖춰야 한다. */}
      {unlockOpen && (
        <HideAmountsUnlockDialog
          open
          onOpenChange={setUnlockOpen}
          onVerified={() => {
            unlockedRef.current = true;
            setUnlockOpen(false);
            handleSubmit();
          }}
        />
      )}
      {/* 결제일 변경 — 다음 회차부터다(D5). 취소하면 저장도 안 한다(폼은 그대로 남는다). */}
      {paymentDayConfirm && (
        <ConfirmDialog
          title={t("editDialog.paymentDayChangeTitle")}
          message={paymentDayConfirm}
          confirmLabel={tCommon("save")}
          loading={isSubmitting}
          onCancel={() => setPaymentDayConfirm(null)}
          onConfirm={() => {
            paymentDayConfirmedRef.current = true;
            setPaymentDayConfirm(null);
            handleSubmit();
          }}
        />
      )}
    </>
  );
}
