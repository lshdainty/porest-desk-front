export interface ApiResponse<T = unknown> {
  success: boolean
  code: string
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
