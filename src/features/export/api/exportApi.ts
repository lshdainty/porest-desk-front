import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export type ExportFormat = 'CSV' | 'EXCEL' | 'JSON'
export type ExportPeriod = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM'
export type ExportDataType =
  | 'EXPENSE'
  | 'ASSET'
  | 'BUDGET'
  | 'CATEGORY'
  | 'MEMO'
  | 'CALENDAR'
  | 'TODO'

export interface ExportTypeCount {
  type: string
  displayName: string
  count: number
}

export interface ExportPreviewTable {
  type: string
  displayName: string
  headers: string[]
  rows: string[][]
  totalCount: number
}

export interface ExportQueryBody {
  period: ExportPeriod
  startDate?: string
  endDate?: string
  types: ExportDataType[]
}

export interface ExportDownloadBody extends ExportQueryBody {
  format: ExportFormat
  mask: boolean
}

/** 선택 종 + 기간의 건수 (체크박스 배지). */
export async function fetchExportCounts(body: ExportQueryBody): Promise<ExportTypeCount[]> {
  const resp: ApiResponse<{ counts: ExportTypeCount[] }> = await apiClient.post('/v1/export/counts', body)
  return resp.data.counts
}

/** 선택 종 + 기간의 미리보기 (종별 상위 N행). */
export async function fetchExportPreview(body: ExportQueryBody): Promise<ExportPreviewTable[]> {
  const resp: ApiResponse<{ tables: ExportPreviewTable[] }> = await apiClient.post('/v1/export/preview', body)
  return resp.data.tables
}

/** 파일 생성 → Blob (대용량은 서버 스트리밍, 브라우저가 점진 수신). */
export async function downloadExport(body: ExportDownloadBody): Promise<Blob> {
  const blob: Blob = await apiClient.post('/v1/export', body, { responseType: 'blob' })
  return blob
}
