import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationKeys } from '@/shared/config'

const SSE_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}/v1/notifications/stream`

export const useNotificationSSE = () => {
  const queryClient = useQueryClient()
  const reconnectDelayRef = useRef(1000)

  useEffect(() => {
    // active 플래그: cleanup 후 stale 콜백이 재연결하는 것을 방지
    let active = true
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (!active) return

      eventSource = new EventSource(SSE_URL, { withCredentials: true })

      eventSource.addEventListener('CONNECT', () => {
        reconnectDelayRef.current = 1000 // backoff 초기화
      })

      eventSource.addEventListener('NOTIFICATION', (event) => {
        try {
          const notification = JSON.parse(event.data)
          queryClient.invalidateQueries({ queryKey: notificationKeys.all })
          toast(notification.title, {
            description: notification.message,
          })
        } catch (e) {
          console.error('[SSE] Failed to parse notification:', e)
        }
      })

      eventSource.onerror = () => {
        // cleanup이 실행된 후 stale 콜백은 무시
        if (!active) return

        console.warn('[SSE] Connection error, reconnecting...')
        eventSource?.close()
        eventSource = null

        // Exponential backoff 재연결
        reconnectTimer = setTimeout(() => {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000)
          connect()
        }, reconnectDelayRef.current)
      }
    }

    connect()

    return () => {
      // cleanup: active 플래그를 먼저 내려서 이후 콜백 차단
      active = false
      eventSource?.close()
      eventSource = null
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }
  }, [queryClient])
}
