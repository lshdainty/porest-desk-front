import { useSearchParams } from "react-router-dom";

/*
 * 거래 검색의 조건 — 주소(`/desk/search?q=&type=&min=&max=&from=&to=`)가 원본이다.
 * 데스크톱 머리의 검색칸 · 폰 상단 바의 검색칸 · 본문이 한 값을 같이 읽고, 입력은 주소를 고쳐 쓴다(replace — 한 글자마다 뒤로 가기 기록이 쌓이지 않게).
 */
export type SearchType = "all" | "EXPENSE" | "INCOME";

export interface SearchCondition {
  q: string;
  type: SearchType;
  /** 숫자만 — 빈 문자열은 제한 없음 */
  min: string;
  max: string;
  /** "YYYY-MM-DD" — 빈 문자열은 제한 없음 */
  from: string;
  to: string;
}

const digits = (v: string | null) => (v ?? "").replace(/\D/g, "");

export function useSearchCondition() {
  const [params, setParams] = useSearchParams();
  const rawType = params.get("type");
  const condition: SearchCondition = {
    q: params.get("q") ?? "",
    type: rawType === "EXPENSE" || rawType === "INCOME" ? rawType : "all",
    min: digits(params.get("min")),
    max: digits(params.get("max")),
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };

  const update = (patch: Partial<SearchCondition>) => {
    const next = { ...condition, ...patch };
    const out = new URLSearchParams();
    if (next.q) out.set("q", next.q);
    if (next.type !== "all") out.set("type", next.type);
    if (next.min) out.set("min", next.min);
    if (next.max) out.set("max", next.max);
    if (next.from) out.set("from", next.from);
    if (next.to) out.set("to", next.to);
    setParams(out, { replace: true });
  };

  return { condition, update };
}

/** 고급 필터(금액 · 기간)가 걸려 있나 — 아이콘 버튼의 점 */
export const hasAdvanced = (c: SearchCondition) =>
  !!(c.min || c.max || c.from || c.to);

/** 서버 인자 — 비어 있으면 키를 싣지 않는다 */
export function toSearchParams(c: SearchCondition) {
  const q = c.q.trim();
  return {
    keyword: q || undefined,
    expenseType: c.type === "all" ? undefined : c.type,
    minAmount: c.min ? Number(c.min) : undefined,
    maxAmount: c.max ? Number(c.max) : undefined,
    startDate: c.from || undefined,
    endDate: c.to || undefined,
  };
}

/** 조건이 하나도 없으면 찾지 않는다(앱과 같다) */
export const isIdle = (c: SearchCondition) =>
  !c.q.trim() && c.type === "all" && !hasAdvanced(c);
