import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useIsMobile } from '@/shared/hooks'
import { KRW } from '@/shared/lib/porest/format'
import {
  getBrandColor,
  BANK_ENTRIES,
  BANK_ENTRIES_BY_CATEGORY,
  BANK_CATEGORY_ORDER,
  INVEST_CATEGORIES,
  type BankEntry,
} from '@/shared/lib/porest/bank-colors'

const INVEST_CATEGORY_SET = new Set(INVEST_CATEGORIES)
import { useCreateAsset } from '@/features/asset'
import { AssetLogo, type AssetType } from '@/entities/asset'

type SubType = '입출금' | '적금' | '예금' | '현금' | '대출'
const SUB_TYPES: SubType[] = ['입출금', '적금', '예금', '현금', '대출']

// 계좌 서브타입 표시 라벨 → asset ns i18n 키(닫힌 enum, 번역 대상). value 는 한글 유지(로직 키/생성명).
const SUBTYPE_KEY: Record<SubType, string> = {
  '입출금': 'assetType.checking',
  '적금': 'assetType.savings',
  '예금': 'assetType.deposit',
  '현금': 'assetType.cash',
  '대출': 'assetType.loan',
}

function toAssetType(sub: SubType): AssetType {
  switch (sub) {
    case '입출금': return 'BANK_ACCOUNT'
    case '적금':   return 'SAVINGS'
    case '예금':   return 'SAVINGS'
    case '현금':   return 'CASH'
    case '대출':   return 'LOAN'
  }
}

interface AssetAddDialogProps {
  open: boolean
  onClose: () => void
}

export function AssetAddDialog({ open, onClose }: AssetAddDialogProps) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const [brand, setBrand] = useState<string>(BANK_ENTRIES[0]?.name ?? '신한')
  const [query, setQuery] = useState('')
  const [nickname, setNickname] = useState('')
  const [subType, setSubType] = useState<SubType>('입출금')
  const [accountNumber, setAccountNumber] = useState('')
  const [balanceStr, setBalanceStr] = useState('0')

  const createMut = useCreateAsset()

  const matchesQuery = (e: BankEntry, q: string) => {
    if (!q) return true
    const needle = q.toLowerCase().replace(/\s+/g, '')
    if (e.name.toLowerCase().replace(/\s+/g, '').includes(needle)) return true
    return (e.aliases ?? []).some(a => a.toLowerCase().replace(/\s+/g, '').includes(needle))
  }

  const filteredByCategory = useMemo(() => {
    const result: [string, BankEntry[]][] = []
    for (const cat of BANK_CATEGORY_ORDER) {
      if (INVEST_CATEGORY_SET.has(cat)) continue
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter(e => matchesQuery(e, query))
      if (list.length > 0) result.push([cat, list])
    }
    return result
  }, [query])

  const brandColor = useMemo(() => getBrandColor(brand), [brand])
  const previewName = nickname.trim() || t('assetAdd.newAccount')

  const reset = () => {
    setBrand(BANK_ENTRIES[0]?.name ?? '신한')
    setQuery('')
    setNickname('')
    setSubType('입출금')
    setAccountNumber('')
    setBalanceStr('0')
  }

  const handleClose = () => {
    if (createMut.isPending) return
    reset()
    onClose()
  }

  const handleSubmit = () => {
    const name = nickname.trim() || `${brand} ${subType}`
    const balance = Number(balanceStr.replace(/[^\d-]/g, '')) || 0
    createMut.mutate(
      {
        assetName: name,
        assetType: toAssetType(subType),
        balance,
        currency: 'KRW',
        institution: brand,
        color: brandColor?.bg,
        memo: accountNumber || undefined,
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

  const Footer = (
    <ModalFooter
      onCancel={handleClose}
      onSave={handleSubmit}
      saveLabel={tc('add')}
      saving={createMut.isPending}
    />
  )

  return (
    <ModalShell
      title={t('assetAdd.title')}
      onClose={handleClose}
      mobile={isMobile}
      size="md"
      footer={Footer}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <AssetLogo
            asset={{ assetName: previewName, institution: brand, color: brandColor?.bg ?? null }}
            size={52}
          />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[var(--fg-primary)] truncate">{previewName}</div>
            <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">{brand} · {t('assetForm.preview')}</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[13px] font-medium">{t('assetAdd.institutionBrand')}</Label>
            <span className="text-[11px] text-[var(--fg-tertiary)]">
              {t('assetForm.entryCount', { count: BANK_ENTRIES.filter(e => !INVEST_CATEGORY_SET.has(e.category)).length })}
            </span>
          </div>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
            />
            <Input
              search
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('assetAdd.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <div
            className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            style={{ maxHeight: 220, overflowY: 'auto' }}
          >
            {filteredByCategory.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                {t('assetForm.noResults')}
              </div>
            ) : (
              filteredByCategory.map(([cat, list]) => (
                <div key={cat}>
                  <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {list.map(e => {
                      const active = e.name === brand
                      return (
                        <button
                          key={e.name}
                          type="button"
                          onClick={() => setBrand(e.name)}
                          className="inline-flex items-center justify-center rounded-full border text-[12.5px] font-medium transition-colors h-7 px-3"
                          style={
                            active
                              ? {
                                  background: e.color.bg,
                                  color: e.color.fg ?? '#fff',
                                  borderColor: 'transparent',
                                }
                              : {
                                  background: 'var(--bg-muted)',
                                  color: 'var(--fg-secondary)',
                                  borderColor: 'transparent',
                                }
                          }
                        >
                          {e.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="asset-nickname" className="text-[13px] font-medium mb-2 block">{t('assetAdd.nickname')}</Label>
          <Input
            id="asset-nickname"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder={t('assetAdd.nicknamePlaceholder')}
          />
        </div>

        <div>
          <Label className="text-[13px] font-medium mb-2 block">{t('assetAdd.accountType')}</Label>
          <Tabs value={subType} onValueChange={v => setSubType(v as SubType)}>
            <TabsList variant="pill" size="sm" className="w-full">
              {SUB_TYPES.map(s => (
                <TabsTrigger key={s} value={s} className="flex-1">
                  {t(SUBTYPE_KEY[s])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="asset-number" className="text-[13px] font-medium mb-2 block">{t('assetAdd.accountNumber')}</Label>
            <Input
              id="asset-number"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="110-***-123456"
            />
          </div>
          <div>
            <Label htmlFor="asset-balance" className="text-[13px] font-medium mb-2 block">{t('assetAdd.balance')}</Label>
            <Input
              id="asset-balance"
              inputMode="numeric"
              value={balanceStr}
              onChange={e => setBalanceStr(e.target.value.replace(/[^\d-]/g, ''))}
              onBlur={() => {
                const n = Number(balanceStr) || 0
                setBalanceStr(n ? KRW(n) : '0')
              }}
              onFocus={() => setBalanceStr(prev => prev.replace(/,/g, ''))}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
