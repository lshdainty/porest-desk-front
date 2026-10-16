import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ds/input";

/** 거래 검색칸 — Text Field 상자형 medium 40 · 앞 돋보기 · 지우기. 상단 바 56 안이라 폰에서도 medium 이다 */
export function SearchField({
  value,
  onValueChange,
  onEnter,
  autoFocus,
}: {
  value: string;
  onValueChange: (v: string) => void;
  /** Enter — 데스크톱 머리에서 검색 화면으로 간다 */
  onEnter?: () => void;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation("common");
  return (
    <Input
      size="medium"
      enterKeyHint="search"
      prefixIcon={<Search />}
      clearable
      autoFocus={autoFocus}
      aria-label={t("searchField")}
      placeholder={t("searchField")}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) onEnter?.();
      }}
    />
  );
}
