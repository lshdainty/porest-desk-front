import { Fragment, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useIsMobile } from '@/shared/hooks'
import { KRW } from '@/shared/lib/porest/format'
import {
  getBrandColor,
  BANK_ENTRIES_BY_CATEGORY,
  INVEST_CATEGORIES,
  type BankCategory,
  type BankEntry,
} from '@/shared/lib/porest/bank-colors'
import { useCreateAsset } from '@/features/asset'

const INVEST_BRANDS: BankEntry[] = INVEST_CATEGORIES.flatMap(
  cat => BANK_ENTRIES_BY_CATEGORY[cat] ?? [],
)

const CATEGORY_LABEL: Record<BankCategory, string> = {
  '시중은행': '시중은행',
  '인터넷은행': '인터넷은행',
  '지방은행': '지방은행',
  '특수은행': '특수은행',
  '저축기관': '저축기관',
  '외국계': '외국계',
  '증권사': '증권사',
  '가상자산': '가상자산거래소',
}

interface InvestmentAddDialogProps {
  open: boolean
  onClose: () => void
}

export function InvestmentAddDialog({ open, onClose }: InvestmentAddDialogProps) {
  const isMobile = useIsMobile()
  const [brand, setBrand] = useState<string>(INVEST_BRANDS[0]?.name ?? '삼성증권')
  const [query, setQuery] = useState('')
  const [productName, setProductName] = useState('')
  const [balanceStr, setBalanceStr] = useState('0')

  const createMut = useCreateAsset()

  const matchesQuery = (e: BankEntry, q: string) => {
    if (!q) return true
    const needle = q.toLowerCase().replace(/\s+/g, '')
    if (e.name.toLowerCase().replace(/\s+/g, '').includes(needle)) return true
    return (e.aliases ?? []).some(a => a.toLowerCase().replace(/\s+/g, '').includes(needle))
  }

  const filteredByCategory = useMemo(() => {
    const result: [BankCategory, BankEntry[]][] = []
    for (const cat of INVEST_CATEGORIES) {
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter(e => matchesQuery(e, query))
      if (list.length > 0) result.push([cat, list])
    }
    return result
  }, [query])

  const filteredCount = filteredByCategory.reduce((sum, [, list]) => sum + list.length, 0)

  const brandColor = useMemo(() => getBrandColor(brand), [brand])
  const previewName = productName.trim() || '새 투자 상품'
  const previewLetter = (brand[0] ?? '?').trim()
  const previewBg = brandColor?.bg ?? 'var(--mossy-500)'
  const previewFg = brandColor?.fg ?? '#fff'

  const reset = () => {
    setBrand(INVEST_BRANDS[0]?.name ?? '삼성증권')
    setQuery('')
    setProductName('')
    setBalanceStr('0')
  }

  const handleClose = () => {
    if (createMut.isPending) return
    reset()
    onClose()
  }

  const handleSubmit = () => {
    const name = productName.trim() || `${brand} 투자`
    const balance = Number(balanceStr.replace(/[^\d-]/g, '')) || 0
    createMut.mutate(
      {
        assetName: name,
        assetType: 'INVESTMENT',
        balance,
        currency: 'KRW',
        institution: brand,
        color: brandColor?.bg,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  const bodyContent = (
    <Fragment>
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
              <Label className="text-[13px] font-medium">증권사·거래소</Label>
              <span className="text-[11px] text-[var(--fg-tertiary)]">총 {INVEST_BRANDS.length}개</span>
            </div>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
              />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="증권사·가상자산거래소·상품거래소 검색"
                className="pl-9"
              />
            </div>
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              style={{ maxHeight: 260, overflowY: 'auto' }}
            >
              {filteredCount === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                  검색 결과가 없어요
                </div>
              ) : (
                filteredByCategory.map(([cat, list]) => (
                  <div key={cat}>
                    <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                      {CATEGORY_LABEL[cat]}
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
                                    background: 'var(--pd-surface-subtle)',
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
            <Label htmlFor="investment-product" className="text-[13px] font-medium mb-2 block">
              상품·종목명
            </Label>
            <Input
              id="investment-product"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="예: KODEX 200, 해외 ETF 포트폴리오"
            />
          </div>

          <div>
            <Label htmlFor="investment-balance" className="text-[13px] font-medium mb-2 block">
              평가액 (원)
            </Label>
            <Input
              id="investment-balance"
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
    </Fragment>
  )

  const footerButtons = (
    <Fragment>
      <Button variant="ghost" onClick={handleClose} disabled={createMut.isPending}>
        취소
      </Button>
      <Button variant="default" onClick={handleSubmit} disabled={createMut.isPending}>
        {createMut.isPending ? '저장 중…' : '추가'}
      </Button>
    </Fragment>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DrawerContent className="max-h-[90%]">
          <DrawerHeader>
            <DrawerTitle>투자 추가</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-5">{bodyContent}</DrawerBody>
          <DrawerFooter>{footerButtons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-[var(--bg-surface)]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-[17px] font-bold tracking-tight">투자 추가</DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-5 pb-2 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {bodyContent}
        </div>
        <DialogFooter className="px-6 py-4 border-t border-[var(--border-subtle)] mt-2 flex-row justify-end gap-2 sm:gap-2">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
