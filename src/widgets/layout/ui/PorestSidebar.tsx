import { useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays, ChartPie, ChevronsUpDown, LayoutDashboard, ListChecks,
  NotebookPen, Receipt, Target, UsersRound, Wallet,
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

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  path: string
}

export const NAV: NavItem[] = [
  { id: 'home',     label: '홈',        icon: LayoutDashboard, path: '/desk' },
  { id: 'assets',   label: '자산',      icon: Wallet,          path: '/desk/asset' },
  { id: 'tx',       label: '가계부',    icon: Receipt,         path: '/desk/expense' },
  { id: 'stats',    label: '통계·분석', icon: ChartPie,        path: '/desk/stats' },
  { id: 'budget',   label: '예산',      icon: Target,          path: '/desk/budget' },
  { id: 'calendar', label: '캘린더',    icon: CalendarDays,    path: '/desk/calendar' },
  { id: 'todo',     label: '할 일',     icon: ListChecks,      path: '/desk/todo' },
  { id: 'dutch',    label: '더치페이',  icon: UsersRound,      path: '/desk/dutch-pay' },
  { id: 'memo',     label: '메모',      icon: NotebookPen,     path: '/desk/memo' },
]

export function PorestSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

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
                style={{ background: 'linear-gradient(135deg, var(--mossy-600), var(--mossy-800))' }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.03em' }}>P</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold" style={{ color: 'var(--mossy-800)', letterSpacing: '-0.02em' }}>
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
        {renderGroup('워크스페이스', NAV.slice(0, 5))}
        {renderGroup('기록', NAV.slice(5))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--mossy-200)', color: 'var(--mossy-800)', fontWeight: 600, fontSize: 12 }}
              >
                김
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold" style={{ fontSize: 13.5 }}>김민서</span>
                <span className="truncate text-xs" style={{ color: 'var(--fg-tertiary)' }}>
                  minseo@porest.cloud
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
