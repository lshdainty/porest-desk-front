import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { List, ListButtonItem } from "@/shared/ds/list";

/**
 * 고르기 시트 · 팝오버 안의 한 목록 — 누르면 바로 고른다(I-20 B 11 · 12 의 카테고리 · 종류 고르기).
 * 고른 줄은 오른쪽 체크 + aria-current(I-19 의 카테고리 고르기와 같다). 막힌 줄은 설명으로 까닭을 보인다.
 */
export interface PickItem {
  value: string;
  title: string;
  detail?: ReactNode;
  /** 앞 붙이개 — 카테고리 타일 */
  prefix?: ReactNode;
  disabled?: boolean;
}

export function PickList({
  label,
  items,
  selected,
  onPick,
}: {
  label: string;
  items: PickItem[];
  selected: string | null;
  onPick: (value: string) => void;
}) {
  return (
    <div className="-mx-x6">
      <List aria-label={label}>
        {items.map((item) => (
          <ListButtonItem
            key={item.value}
            title={item.title}
            detail={item.detail}
            prefix={item.prefix}
            disabled={item.disabled}
            aria-current={selected === item.value ? true : undefined}
            suffix={selected === item.value ? <Check aria-hidden /> : undefined}
            onClick={() => onPick(item.value)}
          />
        ))}
      </List>
    </div>
  );
}
