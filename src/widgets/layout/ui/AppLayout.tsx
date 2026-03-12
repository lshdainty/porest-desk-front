import { Outlet } from 'react-router-dom'
import {
  SidebarInset,
  SidebarProvider,
} from '@/shared/ui/sidebar'
import { AppSidebar } from '@/widgets/sidebar'
import { LayoutHeader } from './LayoutHeader'

export const AppLayout = () => {
  return (
    <SidebarProvider className="md:h-dvh md:overflow-hidden">
      <AppSidebar />
      <SidebarInset className="md:overflow-hidden">
        <LayoutHeader />
        <div className="flex flex-1 flex-col md:min-h-0 md:overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
