export interface TodoProject {
  rowId: number
  userRowId: number
  projectName: string
  description: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  createAt: string
  modifyAt: string
}

export interface TodoProjectFormValues {
  projectName: string
  description?: string
  color?: string
  icon?: string
}
