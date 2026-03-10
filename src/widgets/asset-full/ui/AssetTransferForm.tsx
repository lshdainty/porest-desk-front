import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Asset, AssetTransferFormValues } from '@/entities/asset'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'

interface AssetTransferFormProps {
  assets: Asset[]
  onSubmit: (data: AssetTransferFormValues) => void
  onClose: () => void
  isLoading: boolean
}

export const AssetTransferForm = ({ assets, onSubmit, onClose, isLoading }: AssetTransferFormProps) => {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')

  const [fromAssetRowId, setFromAssetRowId] = useState<number>(assets[0]?.rowId ?? 0)
  const [toAssetRowId, setToAssetRowId] = useState<number>(assets[1]?.rowId ?? 0)
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState('')
  const [description, setDescription] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = useCallback(() => {
    if (!fromAssetRowId || !toAssetRowId || !amount || fromAssetRowId === toAssetRowId) return

    onSubmit({
      fromAssetRowId,
      toAssetRowId,
      amount: parseInt(amount),
      fee: fee ? parseInt(fee) : undefined,
      description: description || undefined,
      transferDate,
    })
  }, [fromAssetRowId, toAssetRowId, amount, fee, description, transferDate, onSubmit])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addTransfer')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>{t('form.fromAsset')}</Label>
            <Select value={String(fromAssetRowId)} onValueChange={(value) => setFromAssetRowId(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.rowId} value={String(asset.rowId)}>{asset.assetName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('form.toAsset')}</Label>
            <Select value={String(toAssetRowId)} onValueChange={(value) => setToAssetRowId(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.rowId} value={String(asset.rowId)}>{asset.assetName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('form.amount')}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('form.amountPlaceholder')}
            />
          </div>

          <div>
            <Label>{t('form.fee')}</Label>
            <Input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label>{t('form.date')}</Label>
            <Input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>

          <div>
            <Label>{t('form.description')}</Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !amount || fromAssetRowId === toAssetRowId}>
            {isLoading ? tc('loading') : tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
