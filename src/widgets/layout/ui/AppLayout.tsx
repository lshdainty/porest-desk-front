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
      <SidebarInset>
        <LayoutHeader />
        <div className="flex flex-1 flex-col overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
