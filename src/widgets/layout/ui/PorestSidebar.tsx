import { useLocation, useNavigate } from 'react-router-dom'
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

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  path: string
}

// NAV 는 MobileHeader/MorePage 가 import 하는 공용 상수 — 컴포넌트 파일에서 함께 export.
// (Fast Refresh 경고는 의도된 것이라 이 줄만 예외 처리. button.tsx buttonVariants 와 동일 관례.)
// eslint-disable-next-line react-refresh/only-export-components
export const NAV: NavItem[] = [
  { id: 'home',     label: '홈',        icon: LayoutDashboard, path: '/desk' },
  { id: 'assets',   label: '자산',      icon: Wallet,          path: '/desk/asset' },
  { id: 'stocks',   label: '증권',      icon: TrendingUp,      path: '/desk/stocks' },
  { id: 'tx',       label: '가계부',    icon: ReceiptText,         path: '/desk/expense' },
  { id: 'stats',    label: '통계·분석', icon: ChartPie,        path: '/desk/stats' },
  { id: 'budget',   label: '예산',      icon: FilePen,          path: '/desk/budget' },
  { id: 'calendar', label: '캘린더',    icon: Calendar1,    path: '/desk/calendar' },
  { id: 'todo',     label: '할 일',     icon: SquareCheckBig,      path: '/desk/todo' },
  { id: 'dutch',    label: '더치페이',  icon: Users,      path: '/desk/dutch-pay' },
  { id: 'memo',     label: '메모',      icon: FileText,     path: '/desk/memo' },
  { id: 'card-benefit', label: '카드 혜택', icon: CreditCard,   path: '/desk/card-benefit' },
]

export function PorestSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
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
                tooltip={it.label}
                isActive={isActive(it.path)}
                onClick={() => navigate(it.path)}
              >
                <IconComp />
                <span>{it.label}</span>
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
        {renderGroup('워크스페이스', NAV.slice(0, 6))}
        {renderGroup('기록', NAV.slice(6))}
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
                <span className="truncate font-semibold" style={{ fontSize: 'var(--text-body-sm)' }}>{userName || '사용자'}</span>
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
