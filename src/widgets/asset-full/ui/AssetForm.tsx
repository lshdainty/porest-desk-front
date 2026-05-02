import { useState, useCallback, useMemo } from 'react'
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
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { IconPicker } from '@/shared/ui/icon-picker'
import { CardCatalogCombobox } from '@/features/card-catalog'
import { useIsMobile } from '@/shared/hooks'

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
  const isMobile = useIsMobile()

  const [assetName, setAssetName] = useState(asset?.assetName ?? '')
  const [assetType, setAssetType] = useState<AssetType>(asset?.assetType ?? 'BANK_ACCOUNT')
  const [balance, setBalance] = useState(asset?.balance?.toString() ?? '0')
  const [institution, setInstitution] = useState(asset?.institution ?? '')
  const [memo, setMemo] = useState(asset?.memo ?? '')
  const [icon, setIcon] = useState(asset?.icon ?? '')
  const [color, setColor] = useState(asset?.color ?? '#6b7280')
  const [cardCatalogRowId, setCardCatalogRowId] = useState<number | null>(asset?.cardCatalog?.rowId ?? null)

  const isCardAsset = assetType === 'CREDIT_CARD' || assetType === 'CHECK_CARD'
  const cardTypeFilter = useMemo(() => {
    if (assetType === 'CREDIT_CARD') return 'CREDIT' as const
    if (assetType === 'CHECK_CARD') return 'CHECK' as const
    return undefined
  }, [assetType])

  const handleAssetTypeChange = (next: AssetType) => {
    const nextIsCard = next === 'CREDIT_CARD' || next === 'CHECK_CARD'
    setAssetType(next)
    if (!nextIsCard) {
      setCardCatalogRowId(null)
    } else if (isCardAsset && next !== assetType) {
      setCardCatalogRowId(null)
    }
  }

  const handleSubmit = useCallback(() => {
    if (!assetName.trim()) return

    const data = {
      assetName: assetName.trim(),
      assetType,
      balance: parseInt(balance) || 0,
      currency: 'KRW',
      icon: icon || undefined,
      color,
      institution: institution || undefined,
      memo: memo || undefined,
      cardCatalogRowId: isCardAsset ? cardCatalogRowId : null,
      ...(asset ? { isIncludedInTotal: asset.isIncludedInTotal ?? 'Y' } : {}),
    }

    onSubmit(data)
  }, [assetName, assetType, balance, icon, color, institution, memo, cardCatalogRowId, isCardAsset, asset, onSubmit])

  const Footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        {tc('cancel')}
      </Button>
      <Button onClick={handleSubmit} disabled={!assetName.trim()} loading={isLoading}>
        {tc('save')}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={asset ? t('editAsset') : t('addAsset')}
      onClose={onClose}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
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
          <Select value={assetType} onValueChange={(value) => handleAssetTypeChange(value as AssetType)}>
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

        {isCardAsset && (
          <div>
            <Label>카드 카탈로그</Label>
            <CardCatalogCombobox
              value={cardCatalogRowId}
              onChange={(rowId) => setCardCatalogRowId(rowId)}
              cardTypeFilter={cardTypeFilter}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              카드를 선택하면 전월 실적 트래킹과 혜택 자동 매칭이 활성화됩니다.
            </p>
          </div>
        )}

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

        <div className="flex gap-3">
          <div>
            <Label>{t('form.icon')}</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="flex-1">
            <Label>{t('form.color')}</Label>
            <input
              type="color"
              className="h-10 w-full rounded-md border"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
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
    </ModalShell>
  )
}
