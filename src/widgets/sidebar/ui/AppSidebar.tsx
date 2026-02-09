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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar'
import { NavMain, type NavItem } from './NavMain'
import { NavUser } from './NavUser'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation('layout')

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
            <SidebarMenuButton size="lg" asChild>
              <a href="/desk">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">POREST Desk</span>
                  <span className="truncate text-xs">Personal workspace</span>
                </div>
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
