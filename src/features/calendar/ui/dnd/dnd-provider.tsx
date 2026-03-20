import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { ReactNode } from 'react'

interface DndProviderWrapperProps {
  children: ReactNode
}

const DndProviderWrapper = ({ children }: DndProviderWrapperProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (_event: DragEndEvent) => {
    // TODO: Implement drag-and-drop event rescheduling
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  )
}

export { DndProviderWrapper }
