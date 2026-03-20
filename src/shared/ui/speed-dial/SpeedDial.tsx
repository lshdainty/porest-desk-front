import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

export interface SpeedDialAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
}

interface SpeedDialProps {
  actions: SpeedDialAction[]
  mainIcon?: React.ReactNode
  activeIcon?: React.ReactNode
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
  className?: string
}

export function SpeedDial({
  actions,
  mainIcon = <Plus className="h-6 w-6" />,
  activeIcon = <X className="h-6 w-6" />,
  isOpen: controlledIsOpen,
  onToggle,
  className,
}: SpeedDialProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.(!isOpen)
    } else {
      setInternalIsOpen(!isOpen)
    }
  }

  return (
    <div className={cn('fixed bottom-6 right-4 z-50 flex items-end justify-end md:bottom-8 md:right-8', className)}>
      <div className="absolute bottom-[28px] right-[28px] flex h-0 w-0 items-center justify-center">
        {actions.map((action, index) => {
          const total = actions.length
          const step = total > 1 ? 90 / (total - 1) : 0
          const angle = total === 1 ? 0 : index * step

          const radius = 80
          const itemRadius = 24

          const radian = (angle * Math.PI) / 180
          const bottom = Math.round(radius * Math.cos(radian)) - itemRadius
          const right = Math.round(radius * Math.sin(radian)) - itemRadius

          return (
            <div
              key={action.label}
              className={cn(
                'absolute transition-all duration-300 ease-out',
                isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-50 opacity-0',
              )}
              style={{
                bottom: isOpen ? `${bottom}px` : `-${itemRadius}px`,
                right: isOpen ? `${right}px` : `-${itemRadius}px`,
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              <Button
                size="icon"
                variant={action.variant || 'default'}
                onClick={() => {
                  action.onClick()
                  if (!isControlled) setInternalIsOpen(false)
                }}
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110',
                  action.className,
                )}
                title={action.label}
              >
                {action.icon}
              </Button>
            </div>
          )
        })}
      </div>

      <Button
        size="icon"
        className={cn(
          'relative z-50 h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105',
          isOpen ? 'rotate-90 bg-gray-800 hover:bg-gray-900' : 'bg-primary hover:bg-primary/90',
        )}
        onClick={handleToggle}
      >
        <div className="relative flex items-center justify-center">
          <div className={cn('absolute transition-opacity duration-200', isOpen ? 'opacity-0' : 'opacity-100')}>
            {mainIcon}
          </div>
          <div className={cn('absolute transition-opacity duration-200', isOpen ? 'opacity-100' : 'opacity-0')}>
            {activeIcon}
          </div>
        </div>
      </Button>
    </div>
  )
}
