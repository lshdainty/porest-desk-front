import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  StickyNote,
  FileText,
  CheckSquare,
  CalendarDays,
  Wallet,
  UsersRound,
} from 'lucide-react'
import Logo from '@/shared/assets/img/porest.svg'
import LogoDark from '@/shared/assets/img/porest_dark.svg'
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
import { useTheme } from '@/shared/ui/theme-provider'
import { NavMain, type NavItem } from './NavMain'
import { NavUser } from './NavUser'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation('layout')
  const { state } = useSidebar()
  const { theme } = useTheme()

  const handleLogo = () => {
    if (state === 'collapsed') return LogoIcon
    return theme === 'light' ? Logo : LogoDark
  }

  const navItems: NavItem[] = [
    { title: t('dashboard'), url: '/desk', icon: LayoutDashboard },
    {
      title: t('postit'),
      url: '/desk/memo',
      icon: StickyNote,
      children: [
        { title: t('memo'), url: '/desk/memo' },
        { title: t('todo'), url: '/desk/todo' },
      ],
    },
    { title: t('calendar'), url: '/desk/calendar', icon: CalendarDays },
    {
      title: t('expense'),
      url: '/desk/expense',
      icon: Wallet,
      children: [
        { title: t('expense'), url: '/desk/expense' },
        { title: t('asset'), url: '/desk/asset' },
        { title: t('dutchPay'), url: '/desk/dutch-pay' },
      ],
    },
    { title: t('group'), url: '/desk/group', icon: UsersRound },
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
                  src={handleLogo()}
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
