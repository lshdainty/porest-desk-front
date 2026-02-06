import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckSquare, CalendarDays, Timer, FileText, Menu } from 'lucide-react'
import { cn } from '@/shared/lib'

interface NavItem {
  labelKey: string
  icon: React.ReactNode
  path: string
}

const navItems: NavItem[] = [
  { labelKey: 'todo', icon: <CheckSquare size={20} />, path: '/desk/todo' },
  { labelKey: 'calendar', icon: <CalendarDays size={20} />, path: '/desk/calendar' },
  { labelKey: 'timer', icon: <Timer size={24} />, path: '/desk/timer' },
  { labelKey: 'memo', icon: <FileText size={20} />, path: '/desk/memo' },
  { labelKey: 'more', icon: <Menu size={20} />, path: '' },
]

export const MobileBottomNav = () => {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavClick = (path: string) => {
    if (path) {
      navigate(path)
    }
    // TODO: 'more' opens a drawer with expense, calculator, dashboard, settings
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background">
      {navItems.map((item) => {
        const isActive = item.path && location.pathname.startsWith(item.path)
        const isCenter = item.labelKey === 'timer'
        return (
          <button
            key={item.labelKey}
            onClick={() => handleNavClick(item.path)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1',
              isActive ? 'text-primary' : 'text-muted-foreground',
              isCenter && 'relative -top-2'
            )}
          >
            {isCenter ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                {item.icon}
              </div>
            ) : (
              item.icon
            )}
            <span className="text-[10px]">{t(item.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
