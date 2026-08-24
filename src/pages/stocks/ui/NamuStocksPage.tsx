import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import { ChevronRight, Search, Unplug } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { useStockSearch } from '@/features/stock/model/useStockMaster'
import { useNamuPrice } from '@/features/stock/model/useNamu'
import type { StockMasterItem } from '@/features/stock/api/stockApi'

interface OutletCtx {
  mobile: boolean
}

/**
 * 나무증권 본문.
 *
 * 토스 화면과 **합치지 않는다.** 나무엔 랭킹·시장지표·호가가 없고 대신 체결추이·투자자별·
 * 채권·금현물이 있다. 한 화면에 합치면 절반이 "이 증권사는 미지원" 이 된다.
 *
 * 지금은 종목 검색 + 현재가까지다. 나무 고유 조회는 이 파일에 쌓으면 되고, 그때 토스 화면은
 * 손대지 않는다.
 */
export function NamuStocksPage({ header }: { header?: React.ReactNode }) {
  const { t } = useTranslation('stocks')
  const { mobile } = useOutletContext<OutletCtx>()
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<StockMasterItem | null>(null)

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {header}
      <Input
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full"
        autoComplete="off"
        spellCheck={false}
      />
      {selected && <NamuPriceCard item={selected} />}
      {keyword.trim().length >= 2 ? (
        <SearchResults keyword={keyword.trim()} onPick={setSelected} />
      ) : (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-body-sm)' }}>
          {t('namu.searchPrompt')}
        </div>
      )}
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
        {t('namu.scopeNotice')}
      </div>
    </div>
  )

  return mobile ? (
    <>
      <MobileBackHeader title={t('nav.title')} />
      <div style={{ padding: '16px 24px 24px' }}>{body}</div>
    </>
  ) : (
    <div style={{ padding: 24, maxWidth: 720 }}>{body}</div>
  )
}

function SearchResults({ keyword, onPick }: { keyword: string; onPick: (item: StockMasterItem) => void }) {
  const { t } = useTranslation('stocks')
  const { data, isLoading, isError } = useStockSearch(keyword)

  if (isLoading) return <Skeleton style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
  if (isError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 4px', color: 'var(--fg-tertiary)', fontSize: 13 }}>
        <Unplug size={16} />
        {t('search.error')}
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 4px', color: 'var(--fg-tertiary)', fontSize: 13 }}>
        <Search size={16} />
        {t('search.empty')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {data.map(item => (
        <button
          key={`${item.marketCode}:${item.symbol}`}
          type="button"
          onClick={() => onPick(item)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 4px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 'var(--text-body-sm)', color: 'var(--fg-primary)' }}>{item.nameKr}</span>
            <span style={{ display: 'block', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {item.marketCode} · {item.symbol}
            </span>
          </span>
          <ChevronRight size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
        </button>
      ))}
    </div>
  )
}

/** 선택 종목의 나무 현재가. 국내·해외 분기는 stock_master 의 국가코드가 정한다. */
function NamuPriceCard({ item }: { item: StockMasterItem }) {
  const { t } = useTranslation('stocks')
  const { data, isLoading, isError } = useNamuPrice(item)

  return (
    <Card variant="bordered" style={{ padding: 18 }}>
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{item.nameKr}</div>
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
        {item.marketCode} · {item.symbol}
      </div>
      <div style={{ marginTop: 12 }}>
        {isLoading ? (
          <Skeleton style={{ height: 28, width: 140 }} />
        ) : isError ? (
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>{t('namu.priceError')}</span>
        ) : !data ? (
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>{t('namu.priceEmpty')}</span>
        ) : (
          <span className="num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
            {data.price} {data.currency}
          </span>
        )}
      </div>
    </Card>
  )
}
