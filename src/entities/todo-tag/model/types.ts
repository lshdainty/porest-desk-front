export interface TodoTag {
  rowId: number
  userRowId: number
  tagName: string
  color: string | null
  createAt: string
  modifyAt: string
}

export interface TodoTagFormValues {
  tagName: string
  color?: string
}
