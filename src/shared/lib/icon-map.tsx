import {
  Landmark, CreditCard, Banknote, PiggyBank, HandCoins, TrendingUp, Wallet,
  UtensilsCrossed, Utensils, Coffee, Car, Bus, Smartphone, Home, ShoppingCart,
  Building2, PawPrint, Gamepad2, Repeat, Hospital, Shirt, Smile, ShieldCheck,
  Gift, GraduationCap, CircleDollarSign, LineChart, Film, Heart, Briefcase,
  Gem, Bitcoin, Code, Flag, BookOpen, Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Lucide 아이콘 이름(kebab-case) → Lucide React 컴포넌트 매핑
 * DB icon 컬럼에 저장된 Lucide 이름 문자열을 컴포넌트로 변환
 */
const iconMap: Record<string, LucideIcon> = {
  // 금융/자산
  'landmark': Landmark,
  'credit-card': CreditCard,
  'banknote': Banknote,
  'piggy-bank': PiggyBank,
  'hand-coins': HandCoins,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'circle-dollar-sign': CircleDollarSign,
  'line-chart': LineChart,
  'bitcoin': Bitcoin,
  'gem': Gem,

  // 식비/음료
  'utensils-crossed': UtensilsCrossed,
  'utensils': Utensils,
  'coffee': Coffee,

  // 교통/통신
  'car': Car,
  'bus': Bus,
  'smartphone': Smartphone,

  // 생활
  'home': Home,
  'shopping-cart': ShoppingCart,
  'building-2': Building2,
  'paw-print': PawPrint,

  // 문화/여가
  'film': Film,
  'gamepad-2': Gamepad2,
  'repeat': Repeat,

  // 건강/외모
  'heart': Heart,
  'hospital': Hospital,
  'shirt': Shirt,
  'smile': Smile,

  // 금융/기타
  'shield-check': ShieldCheck,
  'gift': Gift,
  'graduation-cap': GraduationCap,

  // 근로/소득
  'briefcase': Briefcase,

  // 프로젝트/기타
  'code': Code,
  'flag': Flag,
  'book-open': BookOpen,
  'wrench': Wrench,
}

/**
 * Lucide 아이콘 이름으로 컴포넌트를 반환
 * 매핑이 없으면 null 반환
 */
export const getLucideIcon = (iconName: string | null | undefined): LucideIcon | null => {
  if (!iconName) return null
  return iconMap[iconName] ?? null
}

/**
 * 아이콘 이름을 JSX 요소로 렌더링
 * 매핑이 없으면 fallback 텍스트 반환
 */
export const renderIcon = (
  iconName: string | null | undefined,
  fallback: string,
  size = 16,
) => {
  const Icon = getLucideIcon(iconName)
  if (Icon) return <Icon size={size} />
  return <span>{fallback}</span>
}

/**
 * IconPicker용: 등록된 아이콘 목록 반환
 * [lucide-name, LucideComponent][] 형태
 */
export const getIconEntries = (): [string, LucideIcon][] => {
  return Object.entries(iconMap)
}
