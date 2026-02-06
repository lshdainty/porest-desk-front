import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'

const TOKEN_KEY = 'access_token'

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)
export const hasToken = (): boolean => !!getToken()

const apiBaseUrl = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}`

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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
      removeToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || 'An error occurred'
    toast.error(message)
    return Promise.reject(error)
  },
)
