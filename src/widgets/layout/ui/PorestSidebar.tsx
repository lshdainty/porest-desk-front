import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/shared/ui/sidebar'
import { useCurrentUser } from '@/features/user'
import { useHasSecurities, useMyFeatures } from '@/features/subscription/model/useSubscription'
import { brokerPath, useBrokerLabel } from '@/features/stock/lib/broker'
import { BrandMark } from '@/shared/ui/brand-mark'

export interface NavItem {
  id: string
  labelKey: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  path: string
}

// NAV 는 MobileHeader 가 import 하는 공용 상수 — 컴포넌트 파일에서 함께 export.
// **하위 메뉴는 여기 담지 않는다.** 증권의 하위(증권사)는 연결 상태에 따라 사용자마다
// 달라지는 값이라 정적 상수에 못 들어가고, NAV 를 쓰는 다른 곳(모바일 헤더 제목)은
// 하위를 볼 일이 없다. 사이드바만 자기 자리에서 붙인다.
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
  const { data: features } = useMyFeatures()
  const brokerLabelOf = useBrokerLabel(hasSecurities)

  // **연결한 증권사만 하위에 둔다.** 사이드바는 갈 수 있는 곳을 나열하는 자리고,
  // 미연결 증권사를 넣으면 누를 때마다 "연결해 주세요" 로 되돌아오는 막다른 길이 된다.
  // 연결이 하나뿐이면 하위를 접는다 — 고를 게 없는 트리는 정보를 주지 않는다.
  // (페이지 안 탭도 `connected.length > 1` 에서만 떴다 — 같은 규칙을 자리만 옮긴 것.)
  const connectedBrokers = hasSecurities ? (features?.connectedBrokers ?? []) : []
  const brokerChildren = connectedBrokers.length > 1 ? connectedBrokers : []

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
          const children = it.id === 'stocks' ? brokerChildren : []
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
              {/* 접었다 펴는 토글을 두지 않는다 — 항목이 둘뿐인데 상태를 하나 더 만들면
                  부모를 눌러 화면으로 갈 길이 막힌다(토글이 클릭을 먹는다).
                  아이콘 모드에선 SidebarMenuSub 가 스스로 숨는다. */}
              {children.length > 0 && (
                <SidebarMenuSub>
                  {children.map(b => (
                    <SidebarMenuSubItem key={b}>
                      {/* asChild + Link — 진짜 <a> 라야 가운데클릭·새 탭이 산다.
                          부모 항목은 기존 onClick 방식을 그대로 둔다(동작 변경 없음). */}
                      <SidebarMenuSubButton asChild isActive={location.pathname === brokerPath(b)}>
                        <Link to={brokerPath(b)}>
                          <span>{brokerLabelOf(b)}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
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
            {/* 로그인 로고 미러(마크 svg + 실제 폰트 텍스트, gap 0) 축소판 — 합성 이미지 금지.
                확장: 마크+텍스트 중앙정렬, 접힘: 마크만. fg-brand 토큰이라 다크 자동 전환. */}
            <SidebarMenuButton size="lg" className="justify-center gap-0 data-[state=open]:bg-sidebar-accent">
              {/* 마크 32(사용자 결정) — 펼침·접힘 동일.
                  span 래핑 — 버튼 기본 [&>svg]:size-4 가 직계 svg 를 16px 로 눌러서 회피. */}
              <span className="flex shrink-0 items-center justify-center">
                <BrandMark size={32} />
              </span>
              <span
                className="group-data-[collapsible=icon]:hidden"
                style={{
                  fontSize: 'var(--text-title-lg)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--fg-primary)',
                }}
              >
                Porest Desk
              </span>
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
