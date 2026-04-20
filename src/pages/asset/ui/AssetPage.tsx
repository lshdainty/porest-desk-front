import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Eye, EyeOff, Plus, RefreshCw } from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import { togglePdHideAmounts, useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { useAssets, useAssetSummary } from '@/features/asset'
import type { Asset, AssetType } from '@/entities/asset'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

const ACCOUNT_TYPES: AssetType[] = ['BANK_ACCOUNT', 'SAVINGS', 'CASH']
const CARD_TYPES: AssetType[] = ['CREDIT_CARD', 'CHECK_CARD']
const INVESTMENT_TYPES: AssetType[] = ['INVESTMENT']
const LOAN_TYPES: AssetType[] = ['LOAN']

function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) & 0xffffffff
  return Math.abs(h) % 360
}

function notifyComing(): void {
  console.log('[asset] 개발 중입니다')
}

function Skeleton({ height = 120, style = {} }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: 'linear-gradient(90deg, var(--mist-100), var(--mist-200), var(--mist-100))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s infinite',
        ...style,
      }}
    />
  )
}

export const AssetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  return mobile ? <AssetMobile /> : <AssetDesktop />
}

function AssetLogo({ asset }: { asset: Asset }) {
  const label = (asset.assetName ?? '?').trim().charAt(0) || '?'
  const hue = hashHue(asset.assetName ?? 'asset')
  const bg = asset.color ?? `oklch(0.55 0.12 ${hue})`
  // icon may be emoji or short string; render first visible char when present
  const iconChar = asset.icon && asset.icon.trim().length > 0 ? asset.icon.trim().charAt(0) : null
  return (
    <span className="acc-card__logo" style={{ background: bg, color: '#fff' }}>
      {iconChar ?? label}
    </span>
  )
}

function TypeGroup({
  title,
  assets,
  total,
  totalColor,
  mobile,
  onAdd,
  negativeTotal = false,
}: {
  title: string
  assets: Asset[]
  total: number
  totalColor?: string
  mobile: boolean
  onAdd: () => void
  negativeTotal?: boolean
}) {
  const hidden = useHideAmounts()
  const mask = (n: number) => (hidden ? '••••••' : KRW(n))

  return (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>{title}</h2>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: totalColor }}
        >
          {negativeTotal
            ? hidden
              ? '••••••'
              : `−${KRW(total)}`
            : mask(total)}
          원
        </span>
        <button
          className="p-btn p-btn--ghost p-btn--sm"
          style={{ marginLeft: 8 }}
          onClick={onAdd}
        >
          <Plus size={13} />추가
        </button>
      </div>
      {assets.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 13,
          }}
        >
          등록된 항목이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assets.map(a => (
            <div
              key={a.rowId}
              className="acc-card"
              style={{ cursor: 'pointer' }}
              onClick={notifyComing}
            >
              <AssetLogo asset={a} />
              <div className="acc-card__meta">
                <div className="acc-card__name">
                  {a.assetName}
                  {a.institution && (
                    <span
                      style={{
                        fontWeight: 500,
                        color: 'var(--fg-tertiary)',
                        fontSize: 12,
                        marginLeft: 6,
                      }}
                    >
                      {a.institution}
                    </span>
                  )}
                </div>
                {a.memo && <div className="acc-card__num">{a.memo}</div>}
              </div>
              <div className="num acc-card__amt">
                {negativeTotal
                  ? hidden
                    ? '••••••'
                    : `−${KRW(Math.abs(a.balance))}`
                  : mask(a.balance)}
                원
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  mobile,
  totalBalance,
  accountsTotal,
  investmentsTotal,
  cardsTotal,
  isLoading,
}: {
  mobile: boolean
  totalBalance: number
  accountsTotal: number
  investmentsTotal: number
  cardsTotal: number
  isLoading: boolean
}) {
  const hidden = useHideAmounts()
  const mask = (n: number) => (hidden ? '••••••' : KRW(n))

  return (
    <div className="p-card" style={{ padding: mobile ? 18 : 28, marginBottom: mobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500 }}>총 자산</span>
        <button
          onClick={togglePdHideAmounts}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--fg-tertiary)',
            cursor: 'pointer',
            padding: 2,
            display: 'inline-flex',
          }}
          title={hidden ? '금액 보기' : '금액 가리기'}
        >
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div
        className="num"
        style={{
          fontSize: mobile ? 28 : 36,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: mobile ? 16 : 20,
        }}
      >
        {isLoading ? '—' : mask(totalBalance)}
        <span style={{ fontSize: mobile ? 16 : 20, fontWeight: 700, marginLeft: 4 }}>원</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          paddingTop: mobile ? 14 : 20,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>계좌·예금</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: 700 }}>
            {mask(accountsTotal)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>투자</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: 700 }}>
            {mask(investmentsTotal)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>카드값</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 14 : 16, fontWeight: 700, color: 'var(--berry-700)' }}
          >
            {hidden ? '••••••' : `−${KRW(cardsTotal)}`}
          </div>
        </div>
      </div>
    </div>
  )
}

function useAssetGroups() {
  const assetsQ = useAssets()
  const summaryQ = useAssetSummary()

  const groups = useMemo(() => {
    const list: Asset[] = assetsQ.data?.assets ?? []
    const accounts = list.filter(a => ACCOUNT_TYPES.includes(a.assetType))
    const cards = list.filter(a => CARD_TYPES.includes(a.assetType))
    const investments = list.filter(a => INVESTMENT_TYPES.includes(a.assetType))
    const loans = list.filter(a => LOAN_TYPES.includes(a.assetType))
    const sum = (arr: Asset[]) => arr.reduce((s, a) => s + a.balance, 0)
    return {
      accounts,
      cards,
      investments,
      loans,
      accountsTotal: sum(accounts),
      cardsTotal: Math.abs(sum(cards)),
      investmentsTotal: sum(investments),
      loansTotal: Math.abs(sum(loans)),
    }
  }, [assetsQ.data])

  const totalBalance = summaryQ.data?.totalBalance ?? 0

  return {
    ...groups,
    totalBalance,
    isLoading: assetsQ.isLoading || summaryQ.isLoading,
    isFetching: assetsQ.isFetching || summaryQ.isFetching,
    refetch: () => {
      assetsQ.refetch()
      summaryQ.refetch()
    },
  }
}

function AssetDesktop() {
  const hidden = useHideAmounts()
  const g = useAssetGroups()
  const isEmpty =
    !g.isLoading &&
    g.accounts.length === 0 &&
    g.cards.length === 0 &&
    g.investments.length === 0 &&
    g.loans.length === 0

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>자산</h1>
          <div className="sub">모든 계좌·카드·투자를 한 곳에서</div>
        </div>
        <div className="right">
          <button className="p-btn p-btn--secondary p-btn--sm" onClick={togglePdHideAmounts}>
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />} {hidden ? '보이기' : '가리기'}
          </button>
          <button
            className="p-btn p-btn--secondary p-btn--sm"
            onClick={g.refetch}
            disabled={g.isFetching}
          >
            <RefreshCw size={13} /> 새로고침
          </button>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={notifyComing}>
            <Plus size={14} /> 계좌 추가
          </button>
        </div>
      </div>

      {g.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <Skeleton height={240} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        </div>
      ) : isEmpty ? (
        <div className="p-card" style={{ padding: '64px 20px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 14,
              color: 'var(--fg-tertiary)',
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            아직 등록된 자산이 없어요
          </div>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={notifyComing}>
            <Plus size={14} /> 첫 자산 추가하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <div>
            <SummaryCard
              mobile={false}
              totalBalance={g.totalBalance}
              accountsTotal={g.accountsTotal}
              investmentsTotal={g.investmentsTotal}
              cardsTotal={g.cardsTotal}
              isLoading={g.isLoading}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TypeGroup
              title="계좌 · 예금"
              assets={g.accounts}
              total={g.accountsTotal}
              mobile={false}
              onAdd={notifyComing}
            />
            {g.investments.length > 0 && (
              <TypeGroup
                title="투자"
                assets={g.investments}
                total={g.investmentsTotal}
                mobile={false}
                onAdd={notifyComing}
              />
            )}
            <TypeGroup
              title="카드"
              assets={g.cards}
              total={g.cardsTotal}
              totalColor="var(--berry-700)"
              negativeTotal
              mobile={false}
              onAdd={notifyComing}
            />
            {g.loans.length > 0 && (
              <TypeGroup
                title="대출"
                assets={g.loans}
                total={g.loansTotal}
                totalColor="var(--berry-700)"
                negativeTotal
                mobile={false}
                onAdd={notifyComing}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AssetMobile() {
  const g = useAssetGroups()
  const isEmpty =
    !g.isLoading &&
    g.accounts.length === 0 &&
    g.cards.length === 0 &&
    g.investments.length === 0 &&
    g.loans.length === 0

  if (g.isLoading) {
    return (
      <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={180} />
        <Skeleton height={140} />
        <Skeleton height={140} />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div style={{ padding: '4px 20px 24px' }}>
        <div className="p-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 14,
              color: 'var(--fg-tertiary)',
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            아직 등록된 자산이 없어요
          </div>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={notifyComing}>
            <Plus size={14} /> 첫 자산 추가하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '4px 20px 24px' }}>
      <SummaryCard
        mobile
        totalBalance={g.totalBalance}
        accountsTotal={g.accountsTotal}
        investmentsTotal={g.investmentsTotal}
        cardsTotal={g.cardsTotal}
        isLoading={g.isLoading}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TypeGroup
          title="계좌 · 예금"
          assets={g.accounts}
          total={g.accountsTotal}
          mobile
          onAdd={notifyComing}
        />
        {g.investments.length > 0 && (
          <TypeGroup
            title="투자"
            assets={g.investments}
            total={g.investmentsTotal}
            mobile
            onAdd={notifyComing}
          />
        )}
        <TypeGroup
          title="카드"
          assets={g.cards}
          total={g.cardsTotal}
          totalColor="var(--berry-700)"
          negativeTotal
          mobile
          onAdd={notifyComing}
        />
        {g.loans.length > 0 && (
          <TypeGroup
            title="대출"
            assets={g.loans}
            total={g.loansTotal}
            totalColor="var(--berry-700)"
            negativeTotal
            mobile
            onAdd={notifyComing}
          />
        )}
      </div>
    </div>
  )
}

export default AssetPage
