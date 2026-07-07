import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Calendar1, ChartPie, ChevronsUpDown, CreditCard, LayoutDashboard, SquareCheckBig,
  FileText, ReceiptText, FilePen, TrendingUp, Users, Wallet,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/ui/sidebar'
import { useCurrentUser } from '@/features/user'
import { useHasSecurities } from '@/features/subscription/model/useSubscription'

export interface NavItem {
  id: string
  labelKey: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  path: string
}

// NAV 는 MobileHeader/MorePage 가 import 하는 공용 상수 — 컴포넌트 파일에서 함께 export.
// label 은 layout ns i18n 키(labelKey) — 렌더 시 t(labelKey) 로 해석.
// (Fast Refresh 경고는 의도된 것이라 이 줄만 예외 처리. button.tsx buttonVariants 와 동일 관례.)
// eslint-disable-next-line react-refresh/only-export-components
export const NAV: NavItem[] = [
  { id: 'home',     labelKey: 'home',          icon: LayoutDashboard, path: '/desk' },
  { id: 'assets',   labelKey: 'asset',         icon: Wallet,          path: '/desk/asset' },
  { id: 'stocks',   labelKey: 'stocks',        icon: TrendingUp,      path: '/desk/stocks' },
  { id: 'tx',       labelKey: 'expense',       icon: ReceiptText,         path: '/desk/expense' },
  { id: 'stats',    labelKey: 'statsAnalysis', icon: ChartPie,        path: '/desk/stats' },
  { id: 'budget',   labelKey: 'budget',        icon: FilePen,          path: '/desk/budget' },
  { id: 'calendar', labelKey: 'calendar',      icon: Calendar1,    path: '/desk/calendar' },
  { id: 'todo',     labelKey: 'todoNav',       icon: SquareCheckBig,      path: '/desk/todo' },
  { id: 'dutch',    labelKey: 'dutchPay',      icon: Users,      path: '/desk/dutch-pay' },
  { id: 'memo',     labelKey: 'memo',          icon: FileText,     path: '/desk/memo' },
  { id: 'card-benefit', labelKey: 'cardBenefit', icon: CreditCard,   path: '/desk/card-benefit' },
]

export function PorestSidebar() {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()
  const hasSecurities = useHasSecurities()
  // 증권 메뉴는 구독(SECURITIES) 보유 시에만 노출. slice 후 필터(그룹 경계 보존).
  const gate = (items: NavItem[]) => (hasSecurities ? items : items.filter(n => n.id !== 'stocks'))
  const { data: currentUser } = useCurrentUser()
  const userName = currentUser?.userName ?? ''
  const userEmail = currentUser?.userEmail ?? ''
  const userInitial = userName.charAt(0) || '·'

  const isActive = (path: string) =>
    path === '/desk' ? location.pathname === path : location.pathname.startsWith(path)

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(it => {
          const IconComp = it.icon
          return (
            <SidebarMenuItem key={it.id}>
              <SidebarMenuButton
                tooltip={t(it.labelKey)}
                isActive={isActive(it.path)}
                onClick={() => navigate(it.path)}
              >
                <IconComp />
                <span>{t(it.labelKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div
                className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, var(--bg-brand), var(--fg-brand-strong))' }}
              >
                <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: '800', letterSpacing: '-0.022em' }}>P</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold" style={{ color: 'var(--fg-brand-strong)', letterSpacing: '-0.022em' }}>
                  POREST
                </span>
                <span className="truncate text-xs" style={{ color: 'var(--fg-tertiary)' }}>
                  DESK
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup(t('workspace'), gate(NAV.slice(0, 6)))}
        {renderGroup(t('records'), gate(NAV.slice(6)))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--bg-brand-muted)', color: 'var(--fg-brand-strong)', fontWeight: '600', fontSize: 'var(--text-caption)' }}
              >
                {userInitial}
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold" style={{ fontSize: 'var(--text-body-sm)' }}>{userName || t('userFallback')}</span>
                <span className="truncate text-xs" style={{ color: 'var(--fg-tertiary)' }}>
                  {userEmail || '—'}
                </span>
              </div>
              <ChevronsUpDown
                className="ml-auto size-4 group-data-[collapsible=icon]:hidden"
                style={{ color: 'var(--fg-tertiary)' }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
