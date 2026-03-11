import { Outlet } from 'react-router-dom'
import {
  SidebarInset,
  SidebarProvider,
} from '@/shared/ui/sidebar'
import { AppSidebar } from '@/widgets/sidebar'
import { LayoutHeader } from './LayoutHeader'

export const AppLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="md:h-dvh md:overflow-hidden md:p-4">
        <div className="flex h-full flex-1 flex-col md:min-h-0 md:overflow-hidden md:rounded-xl md:border md:shadow-sm">
          <LayoutHeader />
          <div className="flex flex-1 flex-col md:min-h-0 md:overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
