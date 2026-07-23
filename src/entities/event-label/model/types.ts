export interface EventLabel {
  rowId: number
  userRowId: number
  labelName: string
  color: string
  sortOrder: number
  /** 사용 중 일정 수 — 서버 GROUP BY 집계(미배포 응답 대비 옵셔널). */
  usageCount?: number
}

export interface EventLabelFormValues {
  labelName: string
  color: string
}
