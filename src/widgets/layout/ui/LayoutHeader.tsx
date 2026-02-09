import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/shared/ui/breadcrumb'
import { Separator } from '@/shared/ui/separator'
import { SidebarTrigger } from '@/shared/ui/sidebar'

const pageTitleMap: Record<string, string> = {
  '/desk': 'dashboard',
  '/desk/todo': 'todo',
  '/desk/calendar': 'calendar',
  '/desk/timer': 'timer',
  '/desk/memo': 'memo',
  '/desk/expense': 'expense',
  '/desk/calculator': 'calculator',
}

export const LayoutHeader = () => {
  const { t } = useTranslation('layout')
  const location = useLocation()

  const titleKey = pageTitleMap[location.pathname] ?? 'dashboard'

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t(titleKey)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
