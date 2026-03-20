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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthenticated()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || 'An error occurred'
    toast.error(message)
    return Promise.reject(error)
  },
)
