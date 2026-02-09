import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Calculator,
  FileText,
  Timer,
  Wallet,
} from 'lucide-react'
import Logo from '@/shared/assets/img/porest.svg'
import LogoIcon from '@/shared/assets/img/porest_logo.svg'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/sidebar'
import { NavMain, type NavItem } from './NavMain'
import { NavUser } from './NavUser'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation('layout')
  const { state } = useSidebar()

  const navItems: NavItem[] = [
    { title: t('dashboard'), url: '/desk', icon: LayoutDashboard },
    { title: t('todo'), url: '/desk/todo', icon: CheckSquare },
    { title: t('calendar'), url: '/desk/calendar', icon: CalendarDays },
    { title: t('timer'), url: '/desk/timer', icon: Timer },
    { title: t('memo'), url: '/desk/memo', icon: FileText },
    { title: t('expense'), url: '/desk/expense', icon: Wallet },
    { title: t('calculator'), url: '/desk/calculator', icon: Calculator },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/desk">
                <img
                  src={state === 'collapsed' ? LogoIcon : Logo}
                  alt="POREST Desk"
                  className="h-8"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} label={t('menu')} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
