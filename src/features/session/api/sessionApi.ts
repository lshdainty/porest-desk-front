import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

/**
 * 기기 형태 — 아이콘을 고르는 데만 쓴다.
 *
 * 서버(`UserAgentParser.DeviceKind`)가 정해 내려준다. 기기 이름을 화면에서 다시
 * 뜯지 않는 이유는 그 표가 웹·앱 두 곳에 복제되면 서버 파서를 고칠 때 둘 다
 * 따라오지 않기 때문이다.
 */
export type DeviceKind = 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN'

export interface DeviceSession {
  /** 로그아웃 요청에 그대로 쓴다. */
  sessionId: string
  /** `iPhone · Safari`. 서버가 UA 를 못 알아봤으면 null — 화면이 '알 수 없는 기기' 로 그린다. */
  deviceLabel: string | null
  deviceKind: DeviceKind
  /** [UTC] 마지막으로 토큰을 새로 받은 시각. 한 번도 없었으면 null. */
  lastUsedAt: string | null
  /** [UTC] 로그인 시각. */
  createAt: string | null
  /** 지금 이 브라우저가 쓰고 있는 세션인지. */
  current: boolean
}

export const sessionApi = {
  /** 살아 있는 기기 목록. 최근 사용 순으로 온다(서버 정렬). */
  list: async (): Promise<DeviceSession[]> => {
    const resp: ApiResponse<DeviceSession[]> = await apiClient.get('/v1/users/me/sessions')
    return resp.data ?? []
  },

  /** 기기 하나 로그아웃. */
  revoke: async (sessionId: string): Promise<void> => {
    const resp: ApiResponse = await apiClient.delete(`/v1/users/me/sessions/${sessionId}`)
    if (!resp.success) throw new Error(resp.message)
  },

  /** 모든 기기에서 로그아웃 — 지금 이 브라우저도 포함된다. */
  revokeAll: async (): Promise<void> => {
    const resp: ApiResponse = await apiClient.delete('/v1/users/me/sessions')
    if (!resp.success) throw new Error(resp.message)
  },
}
