import {
  Landmark, CreditCard, Banknote, PiggyBank, HandCoins, TrendingUp, Wallet,
  UtensilsCrossed, Utensils, Coffee, Car, Bus, Smartphone, Home, ShoppingCart,
  Building2, PawPrint, Gamepad2, Repeat, Hospital, Shirt, Smile, ShieldCheck,
  Gift, GraduationCap, CircleDollarSign, LineChart, Film, Heart, Briefcase,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Material Design 아이콘 이름 → Lucide React 아이콘 매핑
 * DB에 저장된 Material icon name 문자열을 Lucide 컴포넌트로 변환
 */
const materialToLucideMap: Record<string, LucideIcon> = {
  // Asset 관련
  account_balance: Landmark,
  credit_card: CreditCard,
  payments: Banknote,
  savings: PiggyBank,
  trending_up: TrendingUp,

  // Expense 카테고리 - 부모
  restaurant: UtensilsCrossed,
  commute: Car,
  home: Home,
  movie: Film,
  favorite: Heart,
  account_balance_wallet: Wallet,
  work: Briefcase,

  // Expense 카테고리 - 자식
  lunch_dining: Utensils,
  coffee: Coffee,
  directions_bus: Bus,
  phone_android: Smartphone,
  shopping_cart: ShoppingCart,
  apartment: Building2,
  pets: PawPrint,
  sports_esports: Gamepad2,
  subscriptions: Repeat,
  local_hospital: Hospital,
  checkroom: Shirt,
  face: Smile,
  health_and_safety: ShieldCheck,
  card_giftcard: Gift,
  school: GraduationCap,
  attach_money: CircleDollarSign,
  show_chart: LineChart,
}

/**
 * Material 아이콘 이름으로 Lucide 아이콘 컴포넌트를 반환
 * 매핑이 없으면 null 반환
 */
export const getLucideIcon = (materialIconName: string | null | undefined): LucideIcon | null => {
  if (!materialIconName) return null
  return materialToLucideMap[materialIconName] ?? null
}

/**
 * Material 아이콘 이름을 Lucide JSX 요소로 렌더링
 * 매핑이 없으면 fallback 텍스트 반환
 */
export const renderMaterialIcon = (
  iconName: string | null | undefined,
  fallback: string,
  size = 16,
) => {
  const Icon = getLucideIcon(iconName)
  if (Icon) return <Icon size={size} />
  return <span>{fallback}</span>
}
