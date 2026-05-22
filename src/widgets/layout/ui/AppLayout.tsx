import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { PorestSidebar } from './PorestSidebar'
import { PorestTopBar } from './PorestTopBar'
import { MobileHeader } from './MobileHeader'
import { MobileTabBar } from './MobileTabBar'
import { MoneyTabBar } from './MoneyTabBar'
import { useDeviceSize } from '@/shared/lib/porest/responsive'
import { AddTxSheet } from '@/features/porest/add-tx/AddTxSheet'

// money group 4 페이지 — 진입 시 MoneyTabBar 표시 (← / 가계부 / 자산 / 통계 / 예산).
const MONEY_PATHS = ['/desk/expense', '/desk/asset', '/desk/stats', '/desk/budget']

export const AppLayout = () => {
  const size = useDeviceSize()
  const [addOpen, setAddOpen] = useState(false)
  const location = useLocation()

  if (size === 'mobile') {
    const isMoney = MONEY_PATHS.some(p => location.pathname.startsWith(p))
    return (
      <div className="m-app" data-screen-label="Mobile">
        <MobileHeader />
        {/* flex flex-col — 페이지가 flex-1 로 m-scroll 전체 height 를 차지하도록 (viewport
            fit 패턴 지원). 자식 페이지가 자연 height 면 동일 동작 (변경 없음). */}
        <div className="m-scroll flex flex-col">
          <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: true }} />
        </div>
        {isMoney ? <MoneyTabBar /> : <MobileTabBar onAdd={() => setAddOpen(true)} />}
        {addOpen && <AddTxSheet mobile onClose={() => setAddOpen(false)} />}
      </div>
    )
  }

  return (
    <SidebarProvider className="h-svh">
      <PorestSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <PorestTopBar onOpenAdd={() => setAddOpen(true)} />
        {/* flex flex-col — 페이지가 flex-1 로 scroll wrapper 전체 height 를 차지하도록
            (viewport fit 패턴 지원). 자식 페이지가 자연 height 면 동일 동작. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
          <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: false }} />
        </div>
      </SidebarInset>
      {addOpen && <AddTxSheet mobile={false} onClose={() => setAddOpen(false)} />}
    </SidebarProvider>
  )
}
