import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationKeys } from '@/shared/config'

const SSE_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}/v1/notifications/stream`

export const useNotificationSSE = () => {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const reconnectDelayRef = useRef(1000)

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(SSE_URL)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('CONNECT', () => {
      console.log('[SSE] Connected')
      reconnectDelayRef.current = 1000 // reset backoff
    })

    eventSource.addEventListener('NOTIFICATION', (event) => {
      try {
        const notification = JSON.parse(event.data)
        // Invalidate React Query cache
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
        // Show toast
        toast(notification.title, {
          description: notification.message,
        })
      } catch (e) {
        console.error('[SSE] Failed to parse notification:', e)
      }
    })

    eventSource.onerror = () => {
      console.warn('[SSE] Connection error, reconnecting...')
      eventSource.close()
      eventSourceRef.current = null

      // Exponential backoff reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000)
        connect()
      }, reconnectDelayRef.current)
    }
  }, [queryClient])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])
}
