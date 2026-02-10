import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ArrowLeft, Trash2, Image, Upload } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useToast } from '@/shared/ui/use-toast'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  useAlbums,
  useAlbum,
  useCreateAlbum,
  useUpdateAlbum,
  useDeleteAlbum,
  useAddPhoto,
  useRemovePhoto,
} from '@/features/album'
import { useUploadFile } from '@/features/file'
import { fileApi } from '@/features/file'
import { useGroups } from '@/features/group'
import type { Album, AlbumPhoto } from '@/entities/album'

export function AlbumFullWidget() {
  const { t } = useTranslation('album')
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [selectedGroupId, setSelectedGroupId] = useState<number>(0)
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editAlbum, setEditAlbum] = useState<Album | null>(null)
  const [deleteAlbum, setDeleteAlbum] = useState<Album | null>(null)
  const [viewPhoto, setViewPhoto] = useState<AlbumPhoto | null>(null)

  const [albumName, setAlbumName] = useState('')
  const [description, setDescription] = useState('')

  const { data: groups = [] } = useGroups()
  const { data: albums = [] } = useAlbums(selectedGroupId)
  const { data: albumDetail } = useAlbum(selectedAlbumId ?? 0)

  const createAlbum = useCreateAlbum()
  const updateAlbum = useUpdateAlbum()
  const deleteAlbumMutation = useDeleteAlbum()
  const addPhoto = useAddPhoto()
  const removePhoto = useRemovePhoto()
  const uploadFile = useUploadFile()

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupId(groupId)
    setSelectedAlbumId(null)
  }

  const handleCreateOpen = () => {
    setAlbumName('')
    setDescription('')
    setIsCreateOpen(true)
  }

  const handleEditOpen = (album: Album) => {
    setAlbumName(album.albumName)
    setDescription(album.description ?? '')
    setEditAlbum(album)
  }

  const handleCreate = () => {
    if (!albumName.trim() || selectedGroupId <= 0) return
    createAlbum.mutate(
      { groupRowId: selectedGroupId, albumName, description },
      {
        onSuccess: () => {
          toast({ title: t('createSuccess') })
          setIsCreateOpen(false)
        },
      }
    )
  }

  const handleUpdate = () => {
    if (!editAlbum || !albumName.trim()) return
    updateAlbum.mutate(
      { id: editAlbum.rowId, data: { albumName, description } },
      {
        onSuccess: () => {
          toast({ title: t('updateSuccess') })
          setEditAlbum(null)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!deleteAlbum) return
    deleteAlbumMutation.mutate(deleteAlbum.rowId, {
      onSuccess: () => {
        toast({ title: t('deleteSuccess') })
        setDeleteAlbum(null)
        if (selectedAlbumId === deleteAlbum.rowId) {
          setSelectedAlbumId(null)
        }
      },
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbumId || !e.target.files?.length) return
    const file = e.target.files[0]

    uploadFile.mutate(
      { file, referenceType: 'ALBUM_PHOTO', referenceRowId: selectedAlbumId },
      {
        onSuccess: (fileInfo) => {
          addPhoto.mutate(
            { albumId: selectedAlbumId, data: { fileRowId: fileInfo.rowId } },
            {
              onSuccess: () => {
                toast({ title: t('photoAdded') })
              },
            }
          )
        },
      }
    )
    e.target.value = ''
  }

  const handleRemovePhoto = (photoId: number) => {
    removePhoto.mutate(photoId, {
      onSuccess: () => {
        toast({ title: t('photoRemoved') })
        setViewPhoto(null)
      },
    })
  }

  // Album detail view
  if (selectedAlbumId && albumDetail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAlbumId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('backToList')}
          </Button>
          <h2 className="text-lg font-semibold">{albumDetail.albumName}</h2>
        </div>

        {albumDetail.description && (
          <p className="text-sm text-muted-foreground">{albumDetail.description}</p>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="photo-upload">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                {t('addPhoto')}
              </span>
            </Button>
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {albumDetail.photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mb-2 opacity-50" />
            <p>{t('noPhotos')}</p>
          </div>
        ) : (
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {albumDetail.photos.map((photo) => (
              <Card
                key={photo.rowId}
                className="cursor-pointer hover:ring-2 hover:ring-primary transition-all overflow-hidden"
                onClick={() => setViewPhoto(photo)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <img
                    src={fileApi.getFileUrl(photo.fileRowId)}
                    alt={photo.caption ?? photo.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Photo Viewer Dialog */}
        <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewPhoto?.caption ?? viewPhoto?.originalName}</DialogTitle>
            </DialogHeader>
            {viewPhoto && (
              <div className="space-y-4">
                <img
                  src={fileApi.getFileUrl(viewPhoto.fileRowId)}
                  alt={viewPhoto.caption ?? viewPhoto.originalName}
                  className="w-full rounded-md"
                />
                <DialogFooter>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePhoto(viewPhoto.rowId)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('removePhoto')}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Album list view
  return (
    <div className="space-y-4">
      {/* Group selector */}
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <Button
            key={group.rowId}
            variant={selectedGroupId === group.rowId ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupSelect(group.rowId)}
          >
            {group.groupName}
          </Button>
        ))}
      </div>

      {selectedGroupId > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('title')}</h2>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus className="h-4 w-4 mr-1" />
              {t('addAlbum')}
            </Button>
          </div>

          {albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mb-2 opacity-50" />
              <p>{t('empty')}</p>
              <p className="text-sm">{t('createFirst')}</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {albums.map((album) => (
                <Card
                  key={album.rowId}
                  className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedAlbumId(album.rowId)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{album.albumName}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {album.photoCount} {t('photos')}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {album.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{album.description}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditOpen(album)
                        }}
                      >
                        {t('editAlbum')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteAlbum(album)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {selectedGroupId <= 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>{t('selectGroup')}</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addAlbum')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('form.albumName')}</Label>
              <Input
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder={t('form.albumNamePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('form.description')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button onClick={handleCreate} disabled={!albumName.trim()}>
              {t('create', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAlbum} onOpenChange={() => setEditAlbum(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editAlbum')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('form.albumName')}</Label>
              <Input
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder={t('form.albumNamePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('form.description')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAlbum(null)}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button onClick={handleUpdate} disabled={!albumName.trim()}>
              {t('save', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteAlbum} onOpenChange={() => setDeleteAlbum(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('delete', { ns: 'common' })}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
