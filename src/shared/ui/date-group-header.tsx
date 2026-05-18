import { MaskAmount } from "@/shared/lib/porest/hide-amounts"

/**
 * 일자별 그룹 헤더 — 날짜·요일·합계 (지출 빨강 / 수입 브랜드).
 *
 * `ExpensePage` 등 거래 리스트 위에 카드 밖 평문 헤더로 사용.
 * 색은 시멘틱 토큰 (`--fg-expense`, `--fg-income`) 만.
 */
export interface DateGroupHeaderProps {
  /** 표시 라벨 (예: "5월 7일"). */
  date: string
  /** 요일 (예: "수"). */
  weekday: string
  /** 일자 합계 — 지출 (양수). */
  expense?: number
  /** 일자 합계 — 수입 (양수). */
  income?: number
}

const KRW = (n: number): string => `${n.toLocaleString()}원`

export function DateGroupHeader({
  date,
  weekday,
  expense = 0,
  income = 0,
}: DateGroupHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 4px 8px",
        fontSize: 'var(--text-label-sm)',
      }}
    >
      <span style={{ fontWeight: 'var(--fw-bold)', color: "var(--fg-primary)" }}>
        {date}
      </span>
      <span style={{ color: "var(--fg-tertiary)" }}>{weekday}</span>
      <span
        className="num"
        style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}
      >
        {expense > 0 && (
          <span style={{ color: "var(--fg-expense)", fontWeight: 'var(--fw-semi)' }}>
            <MaskAmount>{`−${KRW(expense)}`}</MaskAmount>
          </span>
        )}
        {income > 0 && (
          <span style={{ color: "var(--fg-income)", fontWeight: 'var(--fw-semi)' }}>
            <MaskAmount>{`+${KRW(income)}`}</MaskAmount>
          </span>
        )}
      </span>
    </div>
  )
}
