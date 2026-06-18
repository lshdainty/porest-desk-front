import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet } from 'lucide-react'
import type { Asset, AssetType, AssetFormValues, AssetUpdateFormValues, YNType } from '@/entities/asset'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { CAT_PALETTE } from '@/shared/lib/porest/chart-palette'
import { CardCatalogCombobox } from '@/features/card-catalog'
import { useAssets } from '@/features/asset'
import { useIsMobile } from '@/shared/hooks'

interface AssetFormProps {
  asset?: Asset | null
  onSubmit: (data: AssetFormValues | AssetUpdateFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const assetTypes: AssetType[] = ['BANK_ACCOUNT', 'CREDIT_CARD', 'CHECK_CARD', 'CASH', 'SAVINGS', 'LOAN', 'INVESTMENT']

// 자산 기본색 = 팔레트 blue #2c70bf (token 매핑 정합).
const DEFAULT_ASSET_COLOR = CAT_PALETTE.find(p => p.baseHex === '#2c70bf')!.baseHex

export const AssetForm = ({ asset, onSubmit, onClose, isLoading }: AssetFormProps) => {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [assetName, setAssetName] = useState(asset?.assetName ?? '')
  const [assetType, setAssetType] = useState<AssetType>(asset?.assetType ?? 'BANK_ACCOUNT')
  const [balance, setBalance] = useState(asset?.balance?.toString() ?? '0')
  const [institution, setInstitution] = useState(asset?.institution ?? '')
  const [memo, setMemo] = useState(asset?.memo ?? '')
  const [color, setColor] = useState(asset?.color ?? DEFAULT_ASSET_COLOR)
  const [isIncludedInTotal, setIsIncludedInTotal] = useState<YNType>(asset?.isIncludedInTotal ?? 'Y')
  const [cardCatalogRowId, setCardCatalogRowId] = useState<number | null>(asset?.cardCatalog?.rowId ?? null)
  const [creditLimit, setCreditLimit] = useState<string>(
    asset?.creditLimit != null ? String(asset.creditLimit) : '',
  )
  const [paymentDay, setPaymentDay] = useState<string>(
    asset?.paymentDay != null ? String(asset.paymentDay) : '',
  )
  const [paymentAssetRowId, setPaymentAssetRowId] = useState<number | null>(
    asset?.paymentAssetRowId ?? null,
  )

  const { data: assetsData } = useAssets()
  const bankAccounts = useMemo(
    () => (assetsData?.assets ?? []).filter(a => a.assetType === 'BANK_ACCOUNT'),
    [assetsData],
  )

  const isCardAsset = assetType === 'CREDIT_CARD' || assetType === 'CHECK_CARD'
  const isCreditCard = assetType === 'CREDIT_CARD'
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

    const parsedLimit = creditLimit.trim() ? parseInt(creditLimit, 10) : null
    const parsedDay = paymentDay.trim() ? parseInt(paymentDay, 10) : null

    const data = {
      assetName: assetName.trim(),
      assetType,
      balance: parseInt(balance) || 0,
      currency: 'KRW',
      color,
      institution: institution || undefined,
      memo: memo || undefined,
      isIncludedInTotal,
      cardCatalogRowId: isCardAsset ? cardCatalogRowId : null,
      creditLimit: isCreditCard ? (Number.isFinite(parsedLimit as number) ? parsedLimit : null) : null,
      paymentDay: isCreditCard ? (Number.isFinite(parsedDay as number) ? parsedDay : null) : null,
      paymentAssetRowId: isCreditCard ? paymentAssetRowId : null,
    }

    onSubmit(data)
  }, [assetName, assetType, balance, color, institution, memo, isIncludedInTotal, cardCatalogRowId, isCardAsset, isCreditCard, creditLimit, paymentDay, paymentAssetRowId, onSubmit])

  const Footer = (
    <ModalFooter
      onCancel={onClose}
      cancelLabel={tc('cancel')}
      onSave={handleSubmit}
      saveLabel={tc('save')}
      saving={isLoading}
      saveDisabled={!assetName.trim()}
    />
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

        {isCreditCard && (
          <>
            <div>
              <Label>신용한도</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="예: 3000000"
              />
            </div>

            <div>
              <Label>결제일</Label>
              <Select
                value={paymentDay || undefined}
                onValueChange={(v) => setPaymentDay(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="결제일 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>결제계좌</Label>
              <Select
                value={paymentAssetRowId != null ? String(paymentAssetRowId) : undefined}
                onValueChange={(v) => setPaymentAssetRowId(v ? Number(v) : null)}
                disabled={bankAccounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={bankAccounts.length === 0 ? '입출금 계좌가 없어요' : '결제 출금계좌 선택'} />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((a) => (
                    <SelectItem key={a.rowId} value={String(a.rowId)}>
                      {a.institution ? `${a.institution} · ${a.assetName}` : a.assetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
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

        <div>
          <Label>{t('form.color')}</Label>
          <ColorSwatchGroup
            columns={5}
            value={String(
              Math.max(0, CAT_PALETTE.findIndex(p => p.baseHex === color)),
            )}
            onValueChange={(v) => setColor(CAT_PALETTE[Number(v)]!.baseHex)}
            options={CAT_PALETTE.map((p, i) => ({
              value: String(i),
              bg: p.bg,
              fg: p.color,
              label: `색상 ${i + 1}`,
            }))}
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

        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted text-[var(--fg-secondary)]">
            <Wallet size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[var(--fg-primary)]">전체 자산 합계에 포함</div>
            <div className="mt-0.5 text-[11.5px] text-[var(--fg-secondary)]">순자산·총자산 계산에 반영됩니다</div>
          </div>
          <Switch
            checked={isIncludedInTotal === 'Y'}
            onCheckedChange={(b) => setIsIncludedInTotal(b ? 'Y' : 'N')}
          />
        </div>
      </div>
    </ModalShell>
  )
}
