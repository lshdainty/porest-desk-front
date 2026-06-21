import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMyFeatures } from '../model/useSubscription'

/**
 * 증권 라우트 가드 — 구독(SECURITIES) 미보유 시 대시보드로 리다이렉트(직접 URL 접근 차단).
 * 메뉴 숨김은 UX, 이 가드는 클라이언트 차단(서버는 별도 403 게이트).
 */
export function SecuritiesGate({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMyFeatures()
  if (isLoading) {
    return null
  }
  if (!data?.features?.includes('SECURITIES')) {
    return <Navigate to="/desk" replace />
  }
  return <>{children}</>
}
