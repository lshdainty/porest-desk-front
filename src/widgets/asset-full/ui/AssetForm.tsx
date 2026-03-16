import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Asset, AssetType, AssetFormValues, AssetUpdateFormValues } from '@/entities/asset'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
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

interface AssetFormProps {
  asset?: Asset | null
  onSubmit: (data: AssetFormValues | AssetUpdateFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const assetTypes: AssetType[] = ['BANK_ACCOUNT', 'CREDIT_CARD', 'CHECK_CARD', 'CASH', 'SAVINGS', 'LOAN', 'INVESTMENT']

export const AssetForm = ({ asset, onSubmit, onClose, isLoading }: AssetFormProps) => {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')

  const [assetName, setAssetName] = useState(asset?.assetName ?? '')
  const [assetType, setAssetType] = useState<AssetType>(asset?.assetType ?? 'BANK_ACCOUNT')
  const [balance, setBalance] = useState(asset?.balance?.toString() ?? '0')
  const [institution, setInstitution] = useState(asset?.institution ?? '')
  const [memo, setMemo] = useState(asset?.memo ?? '')
  const [color, setColor] = useState(asset?.color ?? '#6b7280')

  const handleSubmit = useCallback(() => {
    if (!assetName.trim()) return

    const data = {
      assetName: assetName.trim(),
      assetType,
      balance: parseInt(balance) || 0,
      currency: 'KRW',
      color,
      institution: institution || undefined,
      memo: memo || undefined,
      ...(asset ? { isIncludedInTotal: asset.isIncludedInTotal ?? 'Y' } : {}),
    }

    onSubmit(data)
  }, [assetName, assetType, balance, color, institution, memo, onSubmit])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{asset ? t('editAsset') : t('addAsset')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>{t('form.assetName')}</Label>
            <Input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder={t('form.assetNamePlaceholder')}
            />
          </div>

          <div>
            <Label>{t('form.assetType')}</Label>
            <Select value={assetType} onValueChange={(value) => setAssetType(value as AssetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`assetType.${type.toLowerCase().replace(/_/g, '')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('form.balance')}</Label>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>

          <div>
            <Label>{t('form.institution')}</Label>
            <Input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={t('form.institutionPlaceholder')}
            />
          </div>

          <div>
            <Label>{t('form.color')}</Label>
            <input
              type="color"
              className="h-10 w-full rounded-md border"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <Label>{t('form.memo')}</Label>
            <Textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t('form.memoPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !assetName.trim()}>
            {tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
