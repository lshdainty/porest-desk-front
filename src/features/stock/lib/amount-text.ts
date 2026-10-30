import { won } from "@/shared/lib/groo/money-text";
import { fmtByCurrency } from "./format";

/** 종목 통화 그대로의 금액 글 — 원화는 원까지, 달러는 $ 와 소수 둘째 자리 */
export function amountText(value: number, currency: string): string {
  return currency === "KRW"
    ? won(Math.round(value))
    : fmtByCurrency(value, currency);
}
