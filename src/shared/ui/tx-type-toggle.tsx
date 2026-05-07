import { Check } from "lucide-react"

import type { ExpenseType } from "@/entities/expense"

/**
 * 거래 종류 토글 chip — `FilterDialog`/`AddTxSheet`/`PresetEditDialog` 공용.
 *
 * mode:
 * - `"multi"` — 다중 선택 (필터/프리셋용). 체크 아이콘 표시.
 * - `"single"` — 단일 선택 (편집용). 활성 1개만.
 *
 * 색은 시멘틱 토큰만 사용 — `--fg-expense`, `--fg-income`, `--fg-transfer`.
 */

export type TxTypeOption = {
  value: ExpenseType
  label: string
}

const SEMANTIC_FG: Record<ExpenseType, string> = {
  EXPENSE: "var(--fg-expense)",
  INCOME: "var(--fg-income)",
  TRANSFER: "var(--fg-transfer)",
}

export interface TxTypeToggleProps {
  options: TxTypeOption[]
  /** multi 일 때는 배열, single 일 때는 단일 값. */
  value: ExpenseType[] | ExpenseType
  onChange: (next: ExpenseType[] | ExpenseType) => void
  mode?: "multi" | "single"
  disabled?: boolean
}

export function TxTypeToggle({
  options,
  value,
  onChange,
  mode = "multi",
  disabled = false,
}: TxTypeToggleProps) {
  const isActive = (v: ExpenseType): boolean =>
    mode === "multi" ? (value as ExpenseType[]).includes(v) : value === v

  const toggle = (v: ExpenseType): void => {
    if (disabled) return
    if (mode === "multi") {
      const arr = value as ExpenseType[]
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
    } else {
      onChange(v)
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map(o => {
        const active = isActive(o.value)
        const fg = SEMANTIC_FG[o.value]
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: 10,
              background: active
                ? "var(--bg-brand-subtle)"
                : "var(--pd-surface-inset)",
              border: active
                ? "1px solid var(--border-brand)"
                : "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-tile)",
              fontWeight: 700,
              fontSize: 13,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              color: active ? fg : "var(--fg-tertiary)",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {active && mode === "multi" && <Check size={12} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
