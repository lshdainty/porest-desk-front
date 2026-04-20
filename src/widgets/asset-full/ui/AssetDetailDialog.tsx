import { useNavigate } from 'react-router-dom'
import { ChevronRight, EyeOff, Pencil } from 'lucide-react'
import type { Asset } from '@/entities/asset'
import type { Expense } from '@/entities/expense'
import { useSearchExpenses } from '@/features/expense'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { KRW } from '@/shared/lib/porest/format'
import { useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { renderIcon } from '@/shared/lib'

type AssetGroup = 'account' | 'card' | 'invest'

const groupOf = (asset: Asset): AssetGroup => {
  if (asset.assetType === 'CREDIT_CARD' || asset.assetType === 'CHECK_CARD') return 'card'
  if (asset.assetType === 'INVESTMENT') return 'invest'
  return 'account'
}

export function AssetDetailDialog({
  asset,
  onClose,
  onEdit,
  onToggleHide,
  mobile,
}: {
  asset: Asset
  onClose: () => void
  onEdit?: (asset: Asset) => void
  onToggleHide?: (asset: Asset) => void
  mobile: boolean
}) {
  const navigate = useNavigate()
  const hidden = useHideAmounts()

  const group = groupOf(asset)
  const isCard = group === 'card'
  const isInv = group === 'invest'

  const absBalance = Math.abs(asset.balance)

  const { data: relatedAll } = useSearchExpenses({ assetId: asset.rowId })
  const relatedTx: Expense[] = (relatedAll ?? []).slice(0, 12)

  const color = asset.color || '#6b7280'
  const title = isCard ? '카드 상세' : isInv ? '투자 상세' : '계좌 상세'
  const valueLabel = isCard ? '이번 달 결제 예정' : isInv ? '평가액' : '잔액'

  const viewAll = () => {
    onClose()
    navigate(`/desk/expense?assetId=${asset.rowId}`)
  }

  const Footer = (
    <>
      {onToggleHide && (
        <button
          className="p-btn p-btn--ghost"
          style={{ marginRight: 'auto' }}
          onClick={() => onToggleHide(asset)}
        >
          <EyeOff size={14} />
          {asset.isIncludedInTotal === 'Y' ? '숨기기' : '표시'}
        </button>
      )}
      {onEdit && (
        <button className="p-btn p-btn--ghost" onClick={() => onEdit(asset)}>
          <Pencil size={14} />편집
        </button>
      )}
      <button className="p-btn p-btn--primary" onClick={onClose}>확인</button>
    </>
  )

  return (
    <ModalShell title={title} onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${color}1a, ${color}08)`,
          border: `1px solid ${color}33`,
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
              background: color,
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {renderIcon(asset.icon, asset.assetName.charAt(0), 22)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
              {asset.assetName}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {asset.institution ? `${asset.institution} · ` : ''}
              {asset.assetType.replace('_', ' ').toLowerCase()}
              {asset.memo && ` · ${asset.memo}`}
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
          {valueLabel}
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
          {hidden ? (
            '••••••'
          ) : (
            <>
              {isCard ? '−' : ''}
              {KRW(absBalance)}
              <span style={{ fontSize: 16, marginLeft: 2 }}>원</span>
            </>
          )}
        </div>
      </div>

      {/* Recent tx */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
            최근 거래{relatedTx.length > 0 ? ` (${relatedTx.length})` : ''}
          </h4>
          <button
            type="button"
            className="all"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 0,
              color: 'var(--fg-secondary)',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
            onClick={viewAll}
          >
            전체 보기 <ChevronRight size={12} />
          </button>
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
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                color: 'var(--fg-tertiary)',
                fontSize: 13,
              }}
            >
              연결된 거래 내역이 없어요.
            </div>
          ) : (
            relatedTx.map(t => <ExpenseRow key={t.rowId} expense={t} />)
          )}
        </div>
      </div>
    </ModalShell>
  )
}
