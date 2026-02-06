import { Outlet } from 'react-router-dom'
import { useIsMobile } from '@/shared/hooks'
import { DesktopSidebar } from './DesktopSidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { LayoutHeader } from './LayoutHeader'

export const AppLayout = () => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex-1 overflow-auto pb-16">
          <Outlet />
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <LayoutHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
