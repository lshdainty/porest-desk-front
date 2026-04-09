import { Outlet } from 'react-router-dom'
import {
  SidebarInset,
  SidebarProvider,
} from '@/shared/ui/sidebar'
import { AppSidebar } from '@/widgets/sidebar'
import { CommandPalette } from '@/widgets/command-palette'
import { LayoutHeader } from './LayoutHeader'

export const AppLayout = () => {
  return (
    <SidebarProvider className="h-dvh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <LayoutHeader />
        <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}
