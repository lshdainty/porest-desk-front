export interface TodoTag {
  rowId: number
  userRowId: number
  tagName: string
  color: string | null
  createAt: string
  modifyAt: string
  /** 사용 중 할일 수 — 서버 GROUP BY 집계(미배포 응답 대비 옵셔널). */
  usageCount?: number
}

export interface TodoTagFormValues {
  tagName: string
  color?: string
}
