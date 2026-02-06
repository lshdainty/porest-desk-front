import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, CalendarDays, Calculator, FileText, Timer, Wallet } from 'lucide-react'
import { cn } from '@/shared/lib'

interface SidebarItem {
  labelKey: string
  icon: React.ReactNode
  path: string
}

const sidebarItems: SidebarItem[] = [
  { labelKey: 'dashboard', icon: <LayoutDashboard size={20} />, path: '/desk' },
  { labelKey: 'todo', icon: <CheckSquare size={20} />, path: '/desk/todo' },
  { labelKey: 'calendar', icon: <CalendarDays size={20} />, path: '/desk/calendar' },
  { labelKey: 'timer', icon: <Timer size={20} />, path: '/desk/timer' },
  { labelKey: 'memo', icon: <FileText size={20} />, path: '/desk/memo' },
  { labelKey: 'expense', icon: <Wallet size={20} />, path: '/desk/expense' },
  { labelKey: 'calculator', icon: <Calculator size={20} />, path: '/desk/calculator' },
]

export const DesktopSidebar = () => {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <h1 className="text-lg font-bold text-sidebar-foreground">POREST Desk</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-2">
        {sidebarItems.map((item) => {
          const isActive = item.path === '/desk'
            ? location.pathname === '/desk'
            : location.pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
              )}
            >
              {item.icon}
              {t(item.labelKey)}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
