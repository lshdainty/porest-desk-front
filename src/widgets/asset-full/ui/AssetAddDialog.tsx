import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { KRW } from '@/shared/lib/porest/format'
import {
  getBrandColor,
  BANK_ENTRIES,
  BANK_ENTRIES_BY_CATEGORY,
  BANK_CATEGORY_ORDER,
  type BankEntry,
} from '@/shared/lib/porest/bank-colors'
import { useCreateAsset } from '@/features/asset'
import type { AssetType } from '@/entities/asset'

type SubType = '입출금' | '적금' | '예금' | '대출'
const SUB_TYPES: SubType[] = ['입출금', '적금', '예금', '대출']

function toAssetType(sub: SubType): AssetType {
  switch (sub) {
    case '입출금': return 'BANK_ACCOUNT'
    case '적금':   return 'SAVINGS'
    case '예금':   return 'SAVINGS'
    case '대출':   return 'LOAN'
  }
}

interface AssetAddDialogProps {
  open: boolean
  onClose: () => void
}

export function AssetAddDialog({ open, onClose }: AssetAddDialogProps) {
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
      if (cat === '증권사') continue // 투자는 별도 다이얼로그에서 처리
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter(e => matchesQuery(e, query))
      if (list.length > 0) result.push([cat, list])
    }
    return result
  }, [query])

  const brandColor = useMemo(() => getBrandColor(brand), [brand])
  const previewName = nickname.trim() || '새 계좌'
  const previewLetter = (brand[0] ?? '?').trim()
  const previewBg = brandColor?.bg ?? 'var(--mossy-500)'
  const previewFg = brandColor?.fg ?? '#fff'

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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-[var(--bg-surface)]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-[17px] font-bold tracking-tight">계좌 추가</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-5 pb-2 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] font-bold text-base flex-shrink-0"
              style={{ background: previewBg, color: previewFg, width: 52, height: 52 }}
            >
              {previewLetter}
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[var(--fg-primary)] truncate">{previewName}</div>
              <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">{brand} · 미리보기</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[13px] font-medium">기관·브랜드</Label>
              <span className="text-[11px] text-[var(--fg-tertiary)]">
                총 {BANK_ENTRIES.filter(e => e.category !== '증권사').length}개
              </span>
            </div>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
              />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="은행명 또는 증권사 검색"
                className="pl-9"
              />
            </div>
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              style={{ maxHeight: 220, overflowY: 'auto' }}
            >
              {filteredByCategory.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                  검색 결과가 없어요
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
                                    background: 'var(--mist-100)',
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
            <Label htmlFor="asset-nickname" className="text-[13px] font-medium mb-2 block">별칭</Label>
            <Input
              id="asset-nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="예: 신한 주거래"
            />
          </div>

          <div>
            <Label className="text-[13px] font-medium mb-2 block">계좌 종류</Label>
            <div
              className="grid grid-cols-4 gap-1 p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)]"
            >
              {SUB_TYPES.map(s => {
                const active = s === subType
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubType(s)}
                    className="h-9 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                    style={
                      active
                        ? { background: 'var(--mossy-800)', color: 'var(--fg-on-brand)' }
                        : { background: 'transparent', color: 'var(--fg-secondary)' }
                    }
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="asset-number" className="text-[13px] font-medium mb-2 block">계좌번호</Label>
              <Input
                id="asset-number"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="110-***-123456"
              />
            </div>
            <div>
              <Label htmlFor="asset-balance" className="text-[13px] font-medium mb-2 block">잔액 (원)</Label>
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

        <DialogFooter className="px-6 py-4 border-t border-[var(--border-subtle)] mt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={createMut.isPending}>
            취소
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={createMut.isPending}>
            {createMut.isPending ? '저장 중…' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
