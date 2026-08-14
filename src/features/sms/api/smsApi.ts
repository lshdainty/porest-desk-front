import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

// ─── 타입 (백엔드 dataimport.sms 미러) ─────────────────────────

export type SmsConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

/** 어느 카드로 기록할지 고를 후보. */
export interface SmsAssetCandidate {
  rowId: number
  assetName: string
  institution: string | null
  assetType: string | null
}

/** 문자 한 통의 해석 결과 — 저장 전 초안. */
export interface SmsParseResult {
  matched: boolean
  confidence: SmsConfidence
  /** 취소 문자 — true 면 저장을 막고 안내만 한다. */
  cancel: boolean
  amount: number | null
  merchant: string | null
  /** 오프셋 없는 로컬 시각("2026-08-13T13:22"). UTC 로 바꾸면 자정 근처 날짜가 밀린다. */
  expenseDate: string | null
  installmentMonths: number | null
  cardHint: string | null
  issuerName: string | null
  cardLast4: string | null
  assetRowId: number | null
  /** 기억해 둔 매핑에서 나온 자산인가 — false 면 "이 카드로 기억" 을 물어볼 만하다. */
  assetRemembered: boolean
  assetCandidates: SmsAssetCandidate[]
  categoryRowId: number | null
  categoryName: string | null
  originalAmount: number | null
  originalCurrency: string | null
}

export interface SmsCommitRequest {
  /** 원문 — 서버가 다시 파싱해 취소 문자를 막고 카드 매핑 키를 도출한다. */
  text: string
  assetRowId: number | null
  categoryRowId: number | null
  amount: number
  merchant?: string | null
  description?: string | null
  /** 오프셋 없는 로컬 시각. `toISOString()` 금지 — UTC 로 밀린다. */
  expenseDate: string
  paymentMethod?: string | null
  installmentMonths?: number | null
  originalAmount?: number | null
  originalCurrency?: string | null
  exchangeRate?: number | null
  rememberCard: boolean
}

export interface SmsCommitResult {
  expenseRowId: number | null
  cardRemembered: boolean
}

// ─── API ───────────────────────────────────────────────────────

/** 문자 해석 — 저장하지 않는다(미리보기). */
export async function parseSms(text: string): Promise<SmsParseResult> {
  const resp: ApiResponse<SmsParseResult> = await apiClient.post('/v1/import/sms/parse', { text })
  return resp.data
}

/** 확정 값으로 지출 생성. */
export async function commitSms(request: SmsCommitRequest): Promise<SmsCommitResult> {
  const resp: ApiResponse<SmsCommitResult> = await apiClient.post('/v1/import/sms/commit', request)
  return resp.data
}
