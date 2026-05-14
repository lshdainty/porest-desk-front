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
 * 전역 API 에러 핸들러:
 * - 4xx/5xx 응답 시 server message(또는 fallback)를 toast.error 로 노출.
 * - sonner id 옵션으로 동일 메시지 중복 방지 — 짧은 시간 내 같은 에러는 1건만 표시.
 * - 호출처(mutation onError 등)에서 toast.error 를 별도로 호출하지 말 것 — 중복 노출.
 *   특수 메시지가 필요하면 mutation.onError 에서 처리하되 e.handled = true 등으로
 *   분기하거나, 이 인터셉터에서 throw 전 무시 플래그 처리(error.config 에 silent: true).
 * - 401 은 toast 없이 즉시 /login 리다이렉트 (세션 만료).
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthenticated()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    // silent flag 가 있으면 호출처에서 직접 처리 — 전역 toast skip
    if (error.config?.silent === true) {
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || 'An error occurred'
    // id 로 dedupe — 같은 메시지가 짧은 시간 내 여러 번 와도 1건만 노출
    toast.error(message, { id: `api-error-${message}` })
    return Promise.reject(error)
  },
)
