export interface MemoFolder {
  rowId: number
  parentRowId: number | null
  folderName: string
  sortOrder: number
  createAt: string
  modifyAt: string
}

export interface Memo {
  rowId: number
  folderRowId: number | null
  title: string
  content: string | null
  isPinned: boolean
  createAt: string
  modifyAt: string
}

export interface MemoFormValues {
  title: string
  content?: string
  folderRowId?: number | null
}

export interface MemoFolderFormValues {
  folderName: string
  parentRowId?: number | null
}
