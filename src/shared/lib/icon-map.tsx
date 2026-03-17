import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'

/**
 * 전체 Lucide 아이콘 이름 목록 re-export (검색/선택용)
 * lucide-react/dynamic의 iconNames를 그대로 노출
 */
export { iconNames }
export type { IconName }

/**
 * 아이콘 이름을 JSX 요소로 렌더링 (lazy load)
 * DB에 저장된 kebab-case 아이콘 이름을 동적으로 렌더링
 * 매핑이 없으면 fallback 텍스트 반환
 */
export const renderIcon = (
  iconName: string | null | undefined,
  fallback: string,
  size = 16,
) => {
  if (!iconName) return <span>{fallback}</span>
  return <DynamicIcon name={iconName as IconName} size={size} />
}
