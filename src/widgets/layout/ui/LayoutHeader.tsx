import { useTranslation } from 'react-i18next'
import { useLocation, Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { ModeToggle } from '@/shared/ui/mode-toggle'
import { Separator } from '@/shared/ui/separator'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { NotificationBell, useNotificationSSE } from '@/features/notification'

interface BreadcrumbEntry {
  label: string
  url?: string
}

const breadcrumbMap: Record<string, BreadcrumbEntry[]> = {
  '/desk': [{ label: 'dashboard' }],
  '/desk/memo': [{ label: 'postit', url: '/desk/memo' }, { label: 'memo' }],
  '/desk/todo': [{ label: 'postit', url: '/desk/memo' }, { label: 'todo' }],
  '/desk/calendar': [{ label: 'calendar' }],
  '/desk/expense': [{ label: 'expense', url: '/desk/expense' }, { label: 'expense' }],
  '/desk/asset': [{ label: 'expense', url: '/desk/expense' }, { label: 'asset' }],
  '/desk/dutch-pay': [{ label: 'expense', url: '/desk/expense' }, { label: 'dutchPay' }],
  '/desk/group': [{ label: 'group' }],
}

export const LayoutHeader = () => {
  const { t } = useTranslation('layout')
  const location = useLocation()

  useNotificationSSE()

  const crumbs = breadcrumbMap[location.pathname] ?? [{ label: 'dashboard' }]

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1
              return (
                <span key={index} className="inline-flex items-center gap-1.5 sm:gap-2.5">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{t(crumb.label)}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.url!}>{t(crumb.label)}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
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
