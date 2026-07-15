import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

// ─── 타입 (백엔드 dataimport 미러) ─────────────────────────────

export type ImportSource = 'POREST' | 'EASYBUDGET' | 'BANKSALAD' | 'TOSS' | 'CUSTOM'

export type ImportField =
  | 'DATE'
  | 'TYPE'
  | 'AMOUNT'
  | 'AMOUNT_OUT'
  | 'AMOUNT_IN'
  | 'CATEGORY'
  | 'SUBCATEGORY'
  | 'ASSET'
  | 'MEMO'

export type ImportMapping = Partial<Record<ImportField, number>>

export interface ImportColumn {
  index: number
  name: string
}

export interface ImportPreviewRow {
  lineNo: number
  date: string | null
  type: string | null
  amount: number | null
  category: string | null
  asset: string | null
  memo: string | null
  duplicate: boolean
  error: string | null
}

export interface ImportAnalyzeResult {
  fileName: string
  totalRows: number
  validRows: number
  duplicateCount: number
  columns: ImportColumn[]
  suggestedMapping: ImportMapping
  preview: ImportPreviewRow[]
}

export interface ImportExecuteResult {
  imported: number
  skipped: number
  failed: number
  failures: { lineNo: number; reason: string }[]
}

// ─── API ───────────────────────────────────────────────────────

/** 파일 분석 — 자동매핑 제안 + 미리보기 + 유효/중복 건수. */
export async function analyzeImport(file: File, source: ImportSource): Promise<ImportAnalyzeResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('source', source)
  const resp: ApiResponse<ImportAnalyzeResult> = await apiClient.post('/v1/import/analyze', fd)
  return resp.data
}

/** 실제 저장 — 최종 매핑·옵션대로 거래 생성. */
export async function executeImport(
  file: File,
  request: { source: ImportSource; mapping: ImportMapping; dupSkip: boolean; autoCat: boolean },
): Promise<ImportExecuteResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  const resp: ApiResponse<ImportExecuteResult> = await apiClient.post('/v1/import/execute', fd)
  return resp.data
}
