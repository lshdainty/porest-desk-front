import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PorestSidebar } from './PorestSidebar'
import { PorestTopBar } from './PorestTopBar'
import { MobileHeader } from './MobileHeader'
import { MobileTabBar } from './MobileTabBar'
import { useDeviceSize } from '@/shared/lib/porest/responsive'
import { AddTxSheet } from '@/features/porest/add-tx/AddTxSheet'

export const AppLayout = () => {
  const size = useDeviceSize()
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('pd_collapsed') === '1')
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('pd_collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  if (size === 'mobile') {
    return (
      <div className="m-app" data-screen-label="Mobile">
        <MobileHeader />
        <div className="m-scroll">
          <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: true }} />
        </div>
        <MobileTabBar onAdd={() => setAddOpen(true)} />
        {addOpen && <AddTxSheet mobile onClose={() => setAddOpen(false)} />}
      </div>
    )
  }

  return (
    <div className="app-shell" data-collapsed={collapsed ? 'true' : 'false'}>
      <PorestSidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className="main">
        <PorestTopBar onOpenAdd={() => setAddOpen(true)} />
        <div className="scroll">
          <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: false }} />
        </div>
      </div>
      {addOpen && <AddTxSheet mobile={false} onClose={() => setAddOpen(false)} />}
    </div>
  )
}
