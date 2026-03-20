import { cn } from '@/shared/lib'
import { GripHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface WidgetWrapperProps extends React.ComponentProps<'div'> {
  title: string
  onClose: () => void
  isEditing: boolean
}

const WidgetWrapper = ({ children, title, onClose, isEditing, className, ...props }: WidgetWrapperProps) => {
  const { t } = useTranslation('dashboard')
  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'group z-10 flex select-none items-center justify-between border-b p-3',
          isEditing ? 'drag-handle cursor-move' : '',
        )}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {isEditing && <GripHorizontal className="h-4 w-4 text-muted-foreground" />}
          {title}
        </h3>
        {isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="text-muted-foreground transition-colors hover:text-destructive"
            title={t('hideWidget')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="relative flex-1 overflow-auto p-0">{children}</div>
    </div>
  )
}

export default WidgetWrapper
