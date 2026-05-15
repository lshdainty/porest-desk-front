import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'

const AUTH_FLAG_KEY = 'authenticated'

export const setAuthenticated = () => localStorage.setItem(AUTH_FLAG_KEY, 'true')
export const clearAuthenticated = () => localStorage.removeItem(AUTH_FLAG_KEY)
export const isAuthenticated = (): boolean => localStorage.getItem(AUTH_FLAG_KEY) === 'true'

// 하위 호환
export const setToken = (_token: string) => setAuthenticated()
export const getToken = (): string | null => isAuthenticated() ? 'cookie' : null
export const removeToken = () => clearAuthenticated()
export const hasToken = (): boolean => isAuthenticated()

const apiBaseUrl = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}`

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const lang = localStorage.getItem('i18nextLng') || 'ko'
    config.headers['Accept-Language'] = lang
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * 전역 API 에러 핸들러 (이중 방어 — sonner id 중복방지 + 시간 throttle):
 * - 4xx/5xx 응답 시 server message(또는 fallback)를 toast.error 로 노출.
 * - sonner id 로 active toast update — 같은 메시지가 화면에 떠 있는 동안엔 1건.
 * - 시간 throttle — toast 가 dismiss 된 직후 같은 메시지가 다시 와도 무시
 *   (예: 사용자가 mutation 버튼을 빠르게 여러 번 클릭, 또는 페이지의 병렬 query 가 같은 에러로 떨어지는 케이스).
 * - 호출처(mutation onError 등)에서 toast.error 를 별도로 호출하지 말 것 — 중복 노출.
 *   특수 메시지가 필요하면 mutation.onError 에서 처리하되 error.config.silent = true 로 전역 skip.
 * - 401 은 toast 없이 /login 리다이렉트 (세션 만료). 병렬 401 동시 발생 시 redirect 1회만.
 */

// 401 동시 발생 시 redirect 1회만 — 병렬 query 가 401 로 떨어질 때 토스트/리다이렉트 중복 방지
let isRedirectingToLogin = false

// 동일 메시지 throttle — sonner id 외 시간 기반 가드 (3초 내 같은 메시지 무시)
const TOAST_THROTTLE_MS = 3000
const recentToastAt: Map<string, number> = new Map()

const showApiErrorToast = (message: string) => {
  const now = Date.now()
  const last = recentToastAt.get(message) ?? 0
  if (now - last < TOAST_THROTTLE_MS) return
  recentToastAt.set(message, now)
  toast.error(message, { id: `api-error-${message}` })
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        clearAuthenticated()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    // silent flag 가 있으면 호출처에서 직접 처리 — 전역 toast skip
    if (error.config?.silent === true) {
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || 'An error occurred'
    showApiErrorToast(message)
    return Promise.reject(error)
  },
)
