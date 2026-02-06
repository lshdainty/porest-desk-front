import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

interface WidgetWrapperProps {
  children: ReactNode
  className?: string
}

export const WidgetWrapper = ({ children, className }: WidgetWrapperProps) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}
