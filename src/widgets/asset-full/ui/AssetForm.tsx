import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Asset, AssetType, AssetFormValues, AssetUpdateFormValues } from '@/entities/asset'

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
    }

    onSubmit(data)
  }, [assetName, assetType, balance, color, institution, memo, onSubmit])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {asset ? t('editAsset') : t('addAsset')}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.assetName')}</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder={t('form.assetNamePlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.assetType')}</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
            >
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`assetType.${type.toLowerCase().replace(/_/g, '')}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.balance')}</label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.institution')}</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={t('form.institutionPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.color')}</label>
            <input
              type="color"
              className="h-10 w-full rounded-md border"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.memo')}</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t('form.memoPlaceholder')}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-md px-4 py-2 text-sm hover:bg-muted"
            onClick={onClose}
            disabled={isLoading}
          >
            {tc('cancel')}
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || !assetName.trim()}
          >
            {tc('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
