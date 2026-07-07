import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Search } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useIsMobile } from '@/shared/hooks'
import { KRW } from '@/shared/lib/porest/format'
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import { useCardCatalogs } from '@/features/card-catalog'
import { useCreateAsset } from '@/features/asset'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import type { CardType, CardCatalogSummary } from '@/entities/card'
import type { AssetType } from '@/entities/asset'

interface CardAddDialogProps {
  open: boolean
  onClose: () => void
}

export function CardAddDialog({ open, onClose }: CardAddDialogProps) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const [cardType, setCardType] = useState<CardType>('CREDIT')
  const [keyword, setKeyword] = useState('')
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false)
  const [selected, setSelected] = useState<CardCatalogSummary | null>(null)
  const [nickname, setNickname] = useState('')
  const [outstandingStr, setOutstandingStr] = useState('0')

  const createMut = useCreateAsset()
  const catalogQ = useCardCatalogs({
    keyword: keyword.trim() || undefined,
    cardType,
    includeDiscontinued: includeDiscontinued || undefined,
    page: 0,
    size: 40,
  })

  const items = catalogQ.data?.content ?? []
  const companyColor = useMemo(
    () => getBrandColor(selected?.company?.name ?? undefined, selected?.cardName ?? undefined),
    [selected],
  )

  const previewName = nickname.trim() || selected?.cardName || t('cardAdd.newCard')
  const previewCompany = selected?.company?.name ?? ''

  const reset = () => {
    setCardType('CREDIT')
    setKeyword('')
    setIncludeDiscontinued(false)
    setSelected(null)
    setNickname('')
    setOutstandingStr('0')
  }

  const handleClose = () => {
    if (createMut.isPending) return
    reset()
    onClose()
  }

  const handleSubmit = () => {
    if (!selected) return
    const name = nickname.trim() || selected.cardName
    const outstanding = Number(outstandingStr.replace(/[^\d-]/g, '')) || 0
    const assetType: AssetType = cardType === 'CREDIT' ? 'CREDIT_CARD' : 'CHECK_CARD'

    createMut.mutate(
      {
        assetName: name,
        assetType,
        balance: outstanding,
        currency: 'KRW',
        institution: selected.company?.name ?? undefined,
        color: companyColor?.bg,
        cardCatalogRowId: selected.rowId,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  if (!open) return null

  const bodyContent = (
    <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            {selected?.imgUrl ? (
              <img
                src={selected.imgUrl}
                alt=""
                className="rounded-[var(--radius-md)] object-cover flex-shrink-0"
                style={{ width: 68, height: 44 }}
              />
            ) : (
              <span
                className="inline-flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
                style={{
                  width: 68,
                  height: 44,
                  background: companyColor?.bg ?? 'var(--bg-sunken)',
                  color: companyColor?.fg ?? 'var(--fg-primary)',
                }}
              >
                <CreditCard size={20} />
              </span>
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[var(--fg-primary)] truncate">
                {previewName}
              </div>
              <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">
                {previewCompany ? `${previewCompany} · ` : ''}{cardType === 'CREDIT' ? t('assetType.creditcard') : t('assetType.checkcard')}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-[13px] font-medium mb-2 block">{t('cardAdd.cardType')}</Label>
            <Tabs
              value={cardType}
              onValueChange={v => {
                setCardType(v as CardType)
                setSelected(null)
              }}
            >
              <TabsList variant="pill" size="sm" className="w-full">
                {(['CREDIT', 'CHECK'] as CardType[]).map(ct => (
                  <TabsTrigger key={ct} value={ct} className="flex-1">
                    {ct === 'CREDIT' ? t('assetType.creditcard') : t('assetType.checkcard')}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[13px] font-medium">{t('cardAdd.cardProduct')}</Label>
              <div className="flex items-center gap-3">
                <label
                  className="inline-flex items-center cursor-pointer select-none"
                  style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', gap: 6 }}
                  title={t('cardAdd.includeDiscontinuedTitle')}
                >
                  <Switch
                    checked={includeDiscontinued}
                    onCheckedChange={setIncludeDiscontinued}
                  />
                  {t('cardAdd.includeDiscontinued')}
                </label>
                {catalogQ.data?.meta?.totalElements != null && (
                  <span className="text-[11px] text-[var(--fg-tertiary)]">
                    {t('cardAdd.resultCount', { count: catalogQ.data.meta.totalElements })}
                  </span>
                )}
              </div>
            </div>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
              />
              <Input
                search
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder={t('cardAdd.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]"
              style={{ maxHeight: 260, overflowY: 'auto' }}
            >
              {catalogQ.isLoading ? (
                <div className="flex flex-col">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <SkeletonBase className="h-7 w-11 rounded-sm shrink-0" />
                      <div className="flex-1 min-w-0">
                        <SkeletonBase className="h-3.5 w-2/3 mb-1.5" />
                        <SkeletonBase className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">{t('cardAdd.noResults')}</div>
              ) : (
                items.map(c => {
                  const active = selected?.rowId === c.rowId
                  const discontinued = c.isDiscontinued === 'Y'
                  return (
                    <button
                      key={c.rowId}
                      type="button"
                      onClick={() => setSelected(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{
                        background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                        opacity: discontinued && !active ? 0.7 : 1,
                      }}
                    >
                      {c.imgUrl ? (
                        <img
                          src={c.imgUrl}
                          alt=""
                          className="rounded object-cover flex-shrink-0"
                          style={{ width: 44, height: 28 }}
                        />
                      ) : (
                        <span
                          className="rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                          style={{
                            width: 44,
                            height: 28,
                            background: getBrandColor(c.company?.name)?.bg ?? 'var(--border-strong)',
                          }}
                        >
                          {(c.company?.name ?? c.cardName).slice(0, 1)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className="truncate text-[13px] flex items-center gap-1.5"
                          style={{
                            color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          <span className="truncate">{c.cardName}</span>
                          {discontinued && (
                            <span
                              className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold flex-shrink-0"
                              style={{
                                background: 'var(--bg-disabled)',
                                color: 'var(--fg-tertiary)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {t('editDialog.discontinued')}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11.5px] text-[var(--fg-tertiary)] mt-0.5">
                          {c.company?.name ?? '—'} · {c.cardType === 'CREDIT' ? t('cardTypeShort.credit') : t('cardTypeShort.check')}
                          {c.annualFee.amount > 0 && (
                            <> · {t('editDialog.annualFeeValue', { amount: KRW(c.annualFee.amount) })}</>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="card-nickname" className="text-[13px] font-medium mb-2 block">{t('cardAdd.nicknameOptional')}</Label>
            <Input
              id="card-nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={selected?.cardName ?? t('cardAdd.nicknamePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="card-outstanding" className="text-[13px] font-medium mb-2 block">
              {t('cardAdd.outstanding')}
            </Label>
            <Input
              id="card-outstanding"
              inputMode="numeric"
              value={outstandingStr}
              onChange={e => setOutstandingStr(e.target.value.replace(/[^\d-]/g, ''))}
              onBlur={() => {
                const n = Number(outstandingStr) || 0
                setOutstandingStr(n ? KRW(n) : '0')
              }}
              onFocus={() => setOutstandingStr(prev => prev.replace(/,/g, ''))}
            />
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t('cardAdd.outstandingHint')}
            </p>
          </div>
    </div>
  )

  const footerButtons = (
    <ModalFooter
      onCancel={handleClose}
      onSave={handleSubmit}
      saveLabel={selected ? tc('add') : t('cardAdd.selectRequired')}
      saving={createMut.isPending}
      saveDisabled={!selected}
    />
  )

  return (
    <ModalShell
      title={t('cardAdd.title')}
      onClose={handleClose}
      mobile={isMobile}
      size="md"
      footer={footerButtons}
    >
      {bodyContent}
    </ModalShell>
  )
}
