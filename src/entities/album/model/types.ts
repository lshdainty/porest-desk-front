export interface Album {
  rowId: number
  groupRowId: number
  albumName: string
  description: string | null
  coverFileRowId: number | null
  photoCount: number
  createAt: string
}

export interface AlbumDetail {
  rowId: number
  groupRowId: number
  albumName: string
  description: string | null
  coverFileRowId: number | null
  photos: AlbumPhoto[]
  createAt: string
}

export interface AlbumPhoto {
  rowId: number
  albumRowId: number
  fileRowId: number
  originalName: string
  contentType: string
  fileSize: number
  userRowId: number
  caption: string | null
  sortOrder: number
  createAt: string
}

export interface AlbumFormValues {
  groupRowId: number
  albumName: string
  description?: string
}

export interface AddPhotoValues {
  fileRowId: number
  caption?: string
}
