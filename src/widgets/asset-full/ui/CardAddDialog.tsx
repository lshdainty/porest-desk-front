import { useMemo, useState } from 'react'
import { CreditCard, Search } from 'lucide-react'
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
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import { useCardCatalogs } from '@/features/card-catalog'
import { useCreateAsset } from '@/features/asset'
import type { CardType, CardCatalogSummary } from '@/entities/card'
import type { AssetType } from '@/entities/asset'

interface CardAddDialogProps {
  open: boolean
  onClose: () => void
}

export function CardAddDialog({ open, onClose }: CardAddDialogProps) {
  const [cardType, setCardType] = useState<CardType>('CREDIT')
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<CardCatalogSummary | null>(null)
  const [nickname, setNickname] = useState('')
  const [outstandingStr, setOutstandingStr] = useState('0')

  const createMut = useCreateAsset()
  const catalogQ = useCardCatalogs({
    keyword: keyword.trim() || undefined,
    cardType,
    page: 0,
    size: 40,
  })

  const items = catalogQ.data?.content ?? []
  const companyColor = useMemo(
    () => getBrandColor(selected?.company?.name ?? undefined, selected?.cardName ?? undefined),
    [selected],
  )

  const previewName = nickname.trim() || selected?.cardName || '새 카드'
  const previewCompany = selected?.company?.name ?? ''

  const reset = () => {
    setCardType('CREDIT')
    setKeyword('')
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-[17px] font-bold tracking-tight">카드 추가</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-5 pb-2 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
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
                  background: companyColor?.bg ?? 'var(--mist-200)',
                  color: companyColor?.fg ?? '#fff',
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
                {previewCompany ? `${previewCompany} · ` : ''}{cardType === 'CREDIT' ? '신용카드' : '체크카드'}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-[13px] font-medium mb-2 block">카드 종류</Label>
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)]"
            >
              {(['CREDIT', 'CHECK'] as CardType[]).map(t => {
                const active = t === cardType
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setCardType(t)
                      setSelected(null)
                    }}
                    className="h-9 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                    style={
                      active
                        ? { background: 'var(--mossy-800)', color: 'var(--fg-on-brand)' }
                        : { background: 'transparent', color: 'var(--fg-secondary)' }
                    }
                  >
                    {t === 'CREDIT' ? '신용카드' : '체크카드'}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[13px] font-medium">카드 상품</Label>
              {catalogQ.data?.meta?.totalElements != null && (
                <span className="text-[11px] text-[var(--fg-tertiary)]">
                  총 {catalogQ.data.meta.totalElements}건
                </span>
              )}
            </div>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
              />
              <Input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="카드명 또는 발급사 검색"
                className="pl-9"
              />
            </div>
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]"
              style={{ maxHeight: 260, overflowY: 'auto' }}
            >
              {catalogQ.isLoading ? (
                <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">불러오는 중…</div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">검색 결과가 없어요</div>
              ) : (
                items.map(c => {
                  const active = selected?.rowId === c.rowId
                  return (
                    <button
                      key={c.rowId}
                      type="button"
                      onClick={() => setSelected(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{
                        background: active ? 'var(--bg-brand-subtle)' : 'transparent',
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
                            background: getBrandColor(c.company?.name)?.bg ?? 'var(--mist-400)',
                          }}
                        >
                          {(c.company?.name ?? c.cardName).slice(0, 1)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className="truncate text-[13px]"
                          style={{
                            color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          {c.cardName}
                        </div>
                        <div className="truncate text-[11.5px] text-[var(--fg-tertiary)] mt-0.5">
                          {c.company?.name ?? '—'} · {c.cardType === 'CREDIT' ? '신용' : '체크'}
                          {c.annualFee.amount > 0 && (
                            <> · 연회비 {c.annualFee.amount.toLocaleString('ko-KR')}원</>
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
            <Label htmlFor="card-nickname" className="text-[13px] font-medium mb-2 block">별칭 (선택)</Label>
            <Input
              id="card-nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={selected?.cardName ?? '예: 신한 Deep Dream'}
            />
          </div>

          <div>
            <Label htmlFor="card-outstanding" className="text-[13px] font-medium mb-2 block">
              현재 사용액 (원)
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
              청구될 금액을 입력하세요. 총 부채에 반영됩니다.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[var(--border-subtle)] mt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={createMut.isPending}>
            취소
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={createMut.isPending || !selected}
          >
            {createMut.isPending ? '저장 중…' : selected ? '추가' : '카드 선택 필요'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
