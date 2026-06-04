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
  /** 태그(카테고리). null 이면 미지정. 에디터 select 7종: 가계부/자산/업무/개인/건강/결제/고정비. */
  tag: string | null
  /** chart palette base hex (예: '#2c70bf'). null 이면 blue 취급. */
  color: string | null
  isPinned: boolean
  createAt: string
  modifyAt: string
}

export interface MemoFormValues {
  title: string
  content?: string
  /** 태그(카테고리) — 기본값 '개인'. */
  tag?: string | null
  /** chart palette base hex — 기본값 blue('#2c70bf'). */
  color?: string | null
  /** 폴더 기능은 새 UI 에서 폐기 — 항상 null 로 전송. */
  folderRowId?: number | null
}

export interface MemoFolderFormValues {
  folderName: string
  parentRowId?: number | null
}
