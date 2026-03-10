import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { dashboardKeys } from '@/shared/config'
import { defaultLayouts, type Widget } from '@/features/dashboard/lib/constants'

interface DashboardContextType {
  layouts: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>
  activeWidgets: string[]
  isEditing: boolean
  isToolboxOpen: boolean
  draggedWidget: Widget | null
  currentBreakpoint: string
  setLayouts: (layouts: Record<string, unknown[]>) => void
  setActiveWidgets: (widgets: string[]) => void
  setIsEditing: (isEditing: boolean) => void
  setIsToolboxOpen: (isOpen: boolean) => void
  setDraggedWidget: (widget: Widget | null) => void
  setCurrentBreakpoint: (breakpoint: string) => void
  handleLayoutChange: (layout: unknown, allLayouts: Record<string, unknown[]>) => void
  handleBreakpointChange: (newBreakpoint: string) => void
  toggleWidget: (widgetId: string) => void
  resetLayout: () => void
  onDrop: (layout: unknown[], layoutItem: unknown, event: unknown) => void
  handleSave: () => void
  handleCancel: () => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export const useDashboardContext = () => {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('Cannot find DashboardProvider')
  return context
}

export const DashboardProvider = ({
  children,
  initialDashboard,
}: {
  children: ReactNode
  initialDashboard: string | null
}) => {
  const { t } = useTranslation('dashboard')
  const queryClient = useQueryClient()

  const [layouts, setLayouts] = useState<Record<string, unknown[]>>(() => {
    if (initialDashboard) {
      try {
        const parsed = JSON.parse(initialDashboard)
        if (parsed.layouts) return parsed.layouts
      } catch {
        console.error('Failed to parse initial dashboard layouts')
      }
    }
    return defaultLayouts
  })

  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    if (initialDashboard) {
      try {
        const parsed = JSON.parse(initialDashboard)
        if (parsed.activeWidgets) return parsed.activeWidgets
      } catch {
        console.error('Failed to parse initial dashboard widgets')
      }
    }
    return defaultLayouts.lg.map((item) => item.i)
  })

  const [isEditing, setIsEditingState] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null)
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')

  const { mutate: updateDashboardLayout } = useMutation({
    mutationFn: (dashboard: string) => dashboardApi.updateLayout(dashboard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.layout() })
    },
  })

  const backupRef = useRef<{ layouts: Record<string, unknown[]>; activeWidgets: string[] } | null>(null)

  const setIsEditing = useCallback(
    (editing: boolean) => {
      if (editing && !isEditing) {
        backupRef.current = {
          layouts: JSON.parse(JSON.stringify(layouts)),
          activeWidgets: [...activeWidgets],
        }
      }
      setIsEditingState(editing)
    },
    [isEditing, layouts, activeWidgets],
  )

  const isDroppingRef = useRef(false)

  const handleLayoutChange = useCallback((_layout: unknown, allLayouts: Record<string, unknown[]>) => {
    // 드롭 직후 Responsive가 자동 발생시키는 onLayoutChange는 무시
    // (onDrop에서 이미 모든 브레이크포인트를 업데이트 했으므로)
    if (isDroppingRef.current) {
      isDroppingRef.current = false
      return
    }
    setLayouts(allLayouts)
  }, [])

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }, [])

  const toggleWidget = (widgetId: string) => {
    setActiveWidgets((prev) =>
      prev.includes(widgetId) ? prev.filter((id) => id !== widgetId) : [...prev, widgetId],
    )
  }

  const resetLayout = () => {
    setLayouts(defaultLayouts)
    const defaultWidgetIds = defaultLayouts.lg.map((item) => item.i)
    setActiveWidgets(defaultWidgetIds)
  }

  const onDrop = (layout: unknown[], _layoutItem: unknown, _event: unknown) => {
    if (!draggedWidget) return

    isDroppingRef.current = true

    // 모든 브레이크포인트에 새 위젯 레이아웃을 추가
    const newLayouts: Record<string, unknown[]> = {}
    Object.keys(layouts).forEach((bp) => {
      if (bp === currentBreakpoint) {
        // 현재 브레이크포인트는 드롭된 위치 그대로 사용
        newLayouts[bp] = layout
      } else {
        const existing = layouts[bp] || []
        const alreadyExists = (existing as Array<{ i: string }>).some(
          (item) => item.i === draggedWidget.id,
        )
        if (!alreadyExists) {
          // 다른 브레이크포인트에는 맨 아래에 추가 (compactor가 정리)
          newLayouts[bp] = [
            ...existing,
            { i: draggedWidget.id, x: 0, y: 999, w: draggedWidget.defaultW, h: draggedWidget.defaultH },
          ]
        } else {
          newLayouts[bp] = existing
        }
      }
    })
    setLayouts(newLayouts)

    if (!activeWidgets.includes(draggedWidget.id)) {
      setActiveWidgets((prev) => [...prev, draggedWidget.id])
    }

    setDraggedWidget(null)
  }

  const handleSave = () => {
    const dashboardConfig = {
      layouts,
      activeWidgets,
    }

    updateDashboardLayout(JSON.stringify(dashboardConfig), {
      onSuccess: () => {
        backupRef.current = null
        setIsToolboxOpen(false)
        setTimeout(() => setIsEditingState(false), 300)
      },
      onError: () => {
        toast.error(t('saveError'))
      },
    })
  }

  const handleCancel = () => {
    if (backupRef.current) {
      setLayouts(backupRef.current.layouts)
      setActiveWidgets(backupRef.current.activeWidgets)
      backupRef.current = null
    }

    setIsToolboxOpen(false)
    setTimeout(() => setIsEditingState(false), 300)
  }

  return (
    <DashboardContext.Provider
      value={{
        layouts: layouts as Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>,
        activeWidgets,
        isEditing,
        isToolboxOpen,
        draggedWidget,
        currentBreakpoint,
        setLayouts,
        setActiveWidgets,
        setIsEditing,
        setIsToolboxOpen,
        setDraggedWidget,
        setCurrentBreakpoint,
        handleLayoutChange,
        handleBreakpointChange,
        toggleWidget,
        resetLayout,
        onDrop,
        handleSave,
        handleCancel,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}
