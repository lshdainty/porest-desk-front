export type ReferenceType = 'EXPENSE_RECEIPT' | 'ALBUM_PHOTO' | 'MEMO_ATTACHMENT'

export interface FileAttachment {
  rowId: number
  originalName: string
  contentType: string
  fileSize: number
  referenceType: string
  referenceRowId: number | null
  createAt: string
}
