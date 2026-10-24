import { useTranslation } from "react-i18next";
import { useHasSecurities } from "@/features/subscription/model/useSubscription";
import { GROUPS, type NavGroup } from "./groups";

/** 전체 메뉴 묶음 — 증권은 구독 보유 시에만, 검색어가 있으면 그룹 구조를 유지한 채 항목만 거른다 */
export function useMoreGroups(query: string): NavGroup[] {
  const { t } = useTranslation("more");
  const hasSecurities = useHasSecurities();

  // 증권 메뉴는 구독(SECURITIES) 보유 시에만 노출
  const visibleGroups: NavGroup[] = hasSecurities
    ? GROUPS
    : GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => i.path !== "/desk/stocks"),
      }));

  // 검색 — 그룹 구조를 유지한 채 항목 필터 (design MoreScreen 정합)
  const q = query.trim().toLowerCase();
  return q
    ? visibleGroups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (item) =>
              t(item.labelKey).toLowerCase().includes(q) ||
              t(item.descKey).toLowerCase().includes(q),
          ),
        }))
        .filter((g) => g.items.length > 0)
    : visibleGroups;
}
