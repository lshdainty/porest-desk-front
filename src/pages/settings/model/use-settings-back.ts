import { useNavigate } from "react-router-dom";
import { hasPreviousEntry } from "@/shared/ds/top-navigation/top-navigation-context";
import type { SectionDef } from "./sections";

/**
 * 폰 ← = 들어온 화면으로(History). 앞 화면이 없으면(주소로 바로 · 새 탭 · 알림) 상위로 **주소를 고쳐 쓴다** —
 * 상위 = `parent` 가 있으면 그 섹션, 없으면 설정 메뉴(Q1-A · I-16 6).
 */
export function useSettingsBack(activeSection: SectionDef | null) {
  const navigate = useNavigate();
  return () => {
    if (hasPreviousEntry()) {
      navigate(-1);
      return;
    }
    const parent = activeSection?.parent;
    navigate(parent ? `/desk/settings?section=${parent}` : "/desk/settings", {
      replace: true,
    });
  };
}
