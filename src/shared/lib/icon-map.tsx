import { DynamicIcon, iconNames } from "lucide-react/dynamic";
import type { IconName } from "lucide-react/dynamic";

/**
 * 전체 Lucide 아이콘 이름 목록 re-export (검색/선택용)
 * lucide-react/dynamic의 iconNames를 그대로 노출
 */
export { iconNames };
export type { IconName };

const iconNameSet = new Set<string>(iconNames);

/** DB에 저장된 이름이 현재 lucide 카탈로그에 존재하는지 검사. */
export const isIconName = (name: string | null | undefined): name is IconName =>
  !!name && iconNameSet.has(name);

/**
 * 아이콘 이름을 JSX 요소로 렌더링 (lazy load)
 * DB에 저장된 kebab-case 아이콘 이름을 동적으로 렌더링
 * 매핑이 없으면 fallback 텍스트 반환
 *
 * lucide 카탈로그에 없는 이름(예: 1.0에서 삭제된 브랜드 아이콘)이 DB에 남아 있을 수 있다.
 * DynamicIcon 은 이런 이름을 만나면 console.error 만 남기고 아무것도 그리지 않으므로,
 * 미리 검사해 fallback 텍스트로 대체한다.
 */
export const renderIcon = (
  iconName: string | null | undefined,
  fallback: string,
  size = 16,
) => {
  if (!isIconName(iconName)) return <span>{fallback}</span>;
  return <DynamicIcon name={iconName} size={size} />;
};
