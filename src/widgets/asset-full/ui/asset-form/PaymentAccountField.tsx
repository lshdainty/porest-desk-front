import { Field } from "@/shared/ds/field";
import { Select, SelectGroup, SelectItem } from "@/shared/ds/select";

/** "없음" 선택지의 값 — 실제 자산 rowId 는 숫자라 겹치지 않는다 */
const NONE = "none";
import type { AssetForm } from "./use-asset-form";

/** 결제 출금계좌(신용카드) · 연결 계좌(체크카드) — 입출금 계좌만 고른다. 신용카드는 결제일에 한 번에, 체크카드는 긁는 즉시 빠져 뜻이 달라 이름을 나눈다 */
export function PaymentAccountField({ f }: { f: AssetForm }) {
  const {
    t,
    kind,
    paymentAssetRowId,
    setPaymentAssetRowId,
    paymentNone,
    setPaymentNone,
    bankAccounts,
  } = f;
  const check = kind === "체크카드";
  return (
    <Field
      label={
        check ? t("editDialog.linkedAccount") : t("editDialog.paymentAccount")
      }
      indicator={t("editDialog.optional")}
      description={
        check
          ? t("editDialog.linkedAccountHelp")
          : t("editDialog.paymentAccountHelp")
      }
    >
      <Select
        // 값이 null 이어도 "없음" 을 골랐거나(수정은 처음부터) 하면 칸에 그 글을 보인다 — 자리 글은 새로 추가하면서 아직 안 고른 때만
        value={
          paymentAssetRowId != null
            ? String(paymentAssetRowId)
            : paymentNone
              ? NONE
              : ""
        }
        onValueChange={(v) => {
          setPaymentAssetRowId(v && v !== NONE ? Number(v) : null);
          setPaymentNone(v === NONE);
        }}
        disabled={bankAccounts.length === 0}
        placeholder={
          bankAccounts.length === 0
            ? t("editDialog.noCheckingAccount")
            : check
              ? t("editDialog.selectLinkedAccount")
              : t("editDialog.selectPaymentAccount")
        }
      >
        {/* 비울 수 있는 칸 — "{칸 이름} 없음" 을 맨 앞 따로 묶음에(select.md). 서버는 명시적 null 을 지움으로 받는다 */}
        <SelectGroup>
          <SelectItem
            value={NONE}
            label={
              check
                ? t("editDialog.noLinkedAccount")
                : t("editDialog.noPaymentAccount")
            }
          />
        </SelectGroup>
        <SelectGroup>
          {bankAccounts.map((a) => (
            <SelectItem
              key={a.rowId}
              value={String(a.rowId)}
              label={
                a.institution
                  ? `${a.institution} · ${a.assetName}`
                  : a.assetName
              }
            />
          ))}
        </SelectGroup>
      </Select>
    </Field>
  );
}
