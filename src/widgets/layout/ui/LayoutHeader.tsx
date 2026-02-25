import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/shared/ui/breadcrumb'
import { ModeToggle } from '@/shared/ui/mode-toggle'
import { Separator } from '@/shared/ui/separator'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { NotificationBell } from '@/features/notification'

const pageTitleMap: Record<string, string> = {
  '/desk': 'dashboard',
  '/desk/todo': 'todo',
  '/desk/calendar': 'calendar',
  '/desk/timer': 'timer',
  '/desk/memo': 'memo',
  '/desk/expense': 'expense',
  '/desk/group': 'group',
  '/desk/calculator': 'calculator',
}

export const LayoutHeader = () => {
  const { t } = useTranslation('layout')
  const location = useLocation()

  const titleKey = pageTitleMap[location.pathname] ?? 'dashboard'

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t(titleKey)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
