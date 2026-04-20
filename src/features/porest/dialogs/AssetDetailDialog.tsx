import { EyeOff, Pencil } from 'lucide-react'
import { TX } from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { TxRow } from '@/shared/ui/porest/primitives'
import { LineChart } from '@/shared/ui/porest/charts'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import type { AssetDraft } from './AssetEditDialog'

export function AssetDetailDialog({
  item,
  onClose,
  onEdit,
  mobile,
}: {
  item: AssetDraft
  onClose: () => void
  onEdit: () => void
  mobile: boolean
}) {
  const isCard = item.group === 'card'
  const isInv = item.group === 'invest'

  const keyword = (item.name || '').split(' ')[0] ?? ''
  const relatedTx =
    keyword.length > 0 ? TX.filter(t => t.account && t.account.includes(keyword)).slice(0, 12) : []

  const base = item.balance || item.outstanding || 1_000_000
  const series = Array.from({ length: 12 }, (_, i) => {
    const noise = Math.sin(i * 0.7) * base * 0.04
    return Math.round(base * (0.92 + i * 0.008) + noise)
  })
  series[series.length - 1] = base

  const title = isCard ? '카드 상세' : isInv ? '투자 상세' : '계좌 상세'
  const amt = isCard ? item.outstanding || 0 : item.balance || 0
  const labelA = isCard ? '이번 달 결제 예정' : isInv ? '평가액' : '잔액'

  const Footer = (
    <>
      <button className="p-btn p-btn--ghost" style={{ marginRight: 'auto' }}>
        <EyeOff size={14} />숨기기
      </button>
      <button className="p-btn p-btn--ghost" onClick={onEdit}>
        <Pencil size={14} />편집
      </button>
      <button className="p-btn p-btn--primary" onClick={onClose}>
        확인
      </button>
    </>
  )

  return (
    <ModalShell title={title} onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
      <div
        style={{
          background: `linear-gradient(135deg, ${item.color}10, ${item.color}04)`,
          border: `1px solid ${item.color}30`,
          borderRadius: 16,
          padding: 22,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: item.color,
              color: item.fg || '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {(item.bank || item.name)[0]}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>{item.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {item.bank}
              {item.type && ` · ${item.type}`}
              {item.number && ` · ${item.number}`}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--fg-tertiary)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            marginBottom: 4,
          }}
        >
          {labelA}
        </div>
        <div
          className="num"
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: isCard ? 'var(--berry-700)' : 'var(--fg-primary)',
          }}
        >
          {isCard ? '−' : ''}
          {KRW(amt)}
          <span style={{ fontSize: 16, marginLeft: 2 }}>원</span>
        </div>
        {isCard && item.limit != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
              fontSize: 12,
              color: 'var(--fg-secondary)',
            }}
          >
            <span>{item.due}일 결제</span>
            <span style={{ color: 'var(--fg-tertiary)' }}>·</span>
            <span>한도 {KRW(item.limit)}원</span>
            <span style={{ flex: 1 }} />
            <span className="num" style={{ fontWeight: 600 }}>
              {(((item.outstanding || 0) / item.limit) * 100).toFixed(0)}% 사용
            </span>
          </div>
        )}
        {isInv && item.changePct != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 13 }}>
            <span
              style={{
                fontWeight: 700,
                color: item.changePct >= 0 ? 'var(--mossy-700)' : 'var(--berry-700)',
              }}
            >
              {item.changePct >= 0 ? '+' : ''}
              {item.changePct}%
            </span>
            <span style={{ color: 'var(--fg-tertiary)' }}>지난달 대비</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
            {isCard ? '최근 12주 사용 추이' : isInv ? '최근 12주 평가액' : '최근 12주 잔액'}
          </h4>
        </div>
        <LineChart
          labels={Array.from({ length: 12 }, (_, i) => `${i + 1}주`)}
          series={[{ label: isCard ? '사용' : '잔액', values: series }]}
          height={140}
          colors={[item.color]}
        />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
            최근 거래 {relatedTx.length > 0 && `(${relatedTx.length})`}
          </h4>
        </div>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '4px 14px',
          }}
        >
          {relatedTx.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              연결된 거래 내역이 없어요.
            </div>
          ) : (
            relatedTx.map(t => <TxRow key={t.id} tx={t} />)
          )}
        </div>
      </div>
    </ModalShell>
  )
}
