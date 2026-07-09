import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

/** 별자리 모양 — 0-100 정규 좌표 점들 + 연결선(점 인덱스 쌍). */
export interface StarMap {
  pts: [number, number][]
  edges: [number, number][]
}

/** 별자리 마스터 — starMap 은 서버가 JSON 문자열로 내려줌(parseStarMap 으로 파싱). */
export interface ConstellationInfo {
  rowId: number
  constellationKey: string
  name: string
  description: string | null
  colorKey: string
  starCount: number
  starMap: string
  sortOrder: number
}

export interface ConstellationToday {
  constellation: ConstellationInfo
  points: number
  goal: number
  collected: boolean
  todoPoints: number
  memoPoints: number
  streak: number
  guardCount: number
  totalCollected: number
}

export type SkyDayStatus = 'GROWN' | 'WITHERED' | 'REST'

export interface SkyDay {
  date: string
  status: SkyDayStatus
  constellationKey: string | null
  colorKey: string | null
  points: number
  guardUsed: boolean
}

export interface CollectionEntry {
  constellation: ConstellationInfo
  collectCount: number
  lastCollectedDate: string | null
}

export interface ConstellationCollection {
  entries: CollectionEntry[]
  collectedKinds: number
  totalCollected: number
}

export function parseStarMap(raw: string): StarMap {
  try {
    const parsed = JSON.parse(raw) as StarMap
    if (Array.isArray(parsed.pts) && Array.isArray(parsed.edges)) return parsed
  } catch {
    /* ignore */
  }
  return { pts: [], edges: [] }
}

/** color_key → 카테고리 팔레트 CSS 변수(라이트/다크 자동 swap — cat-* 별칭). */
export function constellationColorVar(colorKey: string): string {
  return `var(--color-cat-${colorKey})`
}

export const constellationApi = {
  getToday: async (): Promise<ConstellationToday> => {
    const resp: ApiResponse<ConstellationToday> = await apiClient.get('/v1/constellations/today')
    return resp.data
  },
  getSky: async (days: number): Promise<{ days: SkyDay[] }> => {
    const resp: ApiResponse<{ days: SkyDay[] }> = await apiClient.get(`/v1/constellations/sky?days=${days}`)
    return resp.data
  },
  getCollection: async (): Promise<ConstellationCollection> => {
    const resp: ApiResponse<ConstellationCollection> = await apiClient.get('/v1/constellations/collection')
    return resp.data
  },
}
