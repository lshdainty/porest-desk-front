import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import type { Asset, AssetFormValues, AssetType, AssetUpdateFormValues } from '@/entities/asset'

export const BANK_PRESETS: { k: string; color: string }[] = [
  { k: '신한', color: '#0046FF' },
  { k: 'KB국민', color: '#FFBC00' },
  { k: '우리', color: '#0067AC' },
  { k: '하나', color: '#008C74' },
  { k: 'NH농협', color: '#00A149' },
  { k: '토스뱅크', color: '#0064FF' },
  { k: '카카오뱅크', color: '#FEE500' },
  { k: '케이뱅크', color: '#1E1E1E' },
  { k: '현대', color: '#1C2951' },
  { k: '삼성', color: '#1428A0' },
]

export type AssetGroup = 'account' | 'card' | 'invest'

/**
 * Legacy mock shape — kept only for the sibling (unused) AssetDetailDialog.tsx
 * compatibility. New code should use `Asset` from `@/entities/asset`.
 */
export interface AssetDraft {
  id: string
  group: AssetGroup
  bank: string
  name: string
  color: string
  type?: string
  number?: string
  balance?: number
  outstanding?: number
  limit?: number
  due?: number
  changePct?: number
  changeAmt?: number
  fg?: string
}

const ACCOUNT_SUBTYPES: { label: string; value: AssetType }[] = [
  { label: '입출금', value: 'BANK_ACCOUNT' },
  { label: '적금', value: 'SAVINGS' },
  { label: '현금', value: 'CASH' },
  { label: '대출', value: 'LOAN' },
]
const CARD_SUBTYPES: { label: string; value: AssetType }[] = [
  { label: '신용카드', value: 'CREDIT_CARD' },
  { label: '체크카드', value: 'CHECK_CARD' },
]

const groupOfType = (t: AssetType): AssetGroup => {
  if (t === 'CREDIT_CARD' || t === 'CHECK_CARD' || t === 'LOAN') return 'card'
  if (t === 'INVESTMENT') return 'invest'
  return 'account'
}

const defaultTypeForGroup = (g: AssetGroup): AssetType => {
  if (g === 'card') return 'CREDIT_CARD'
  if (g === 'invest') return 'INVESTMENT'
  return 'BANK_ACCOUNT'
}

export interface AssetEditDialogProps {
  item: Asset | null
  group: AssetGroup
  onClose: () => void
  onCreate: (values: AssetFormValues) => void
  onUpdate: (values: AssetUpdateFormValues) => void
  onDelete?: () => void
  mobile: boolean
  isSubmitting?: boolean
}

export function AssetEditDialog({
  item,
  group,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  mobile,
  isSubmitting,
}: AssetEditDialogProps) {
  const isNew = !item
  const initialGroup: AssetGroup = item ? groupOfType(item.assetType) : group

  const [assetType, setAssetType] = useState<AssetType>(
    item?.assetType ?? defaultTypeForGroup(initialGroup),
  )
  const [institution, setInstitution] = useState(item?.institution ?? BANK_PRESETS[0]!.k)
  const [color, setColor] = useState(item?.color ?? BANK_PRESETS[0]!.color)
  const [assetName, setAssetName] = useState(item?.assetName ?? '')
  const [memo, setMemo] = useState(item?.memo ?? '')
  const [balance, setBalance] = useState(String(item?.balance ?? 0))
  const [touched, setTouched] = useState(false)

  const editingGroup: AssetGroup = groupOfType(assetType)

  const nameTrim = assetName.trim()
  const valid = nameTrim.length > 0 && institution.trim().length > 0

  const save = () => {
    setTouched(true)
    if (!valid) return
    const parsedBalance = parseInt(balance, 10) || 0
    if (isNew) {
      const payload: AssetFormValues = {
        assetName: nameTrim,
        assetType,
        balance: parsedBalance,
        institution: institution.trim() || undefined,
        color: color || undefined,
        memo: memo.trim() || undefined,
      }
      onCreate(payload)
    } else {
      const payload: AssetUpdateFormValues = {
        assetName: nameTrim,
        assetType,
        balance: parsedBalance,
        institution: institution.trim() || undefined,
        color: color || undefined,
        memo: memo.trim() || undefined,
        isIncludedInTotal: item?.isIncludedInTotal,
      }
      onUpdate(payload)
    }
  }

  const titleAction = isNew ? '추가' : '편집'
  const title =
    editingGroup === 'account'
      ? `계좌 ${titleAction}`
      : editingGroup === 'card'
      ? `카드 ${titleAction}`
      : `투자 상품 ${titleAction}`

  const nameLabel = editingGroup === 'invest' ? '상품명' : '별칭'
  const balanceLabel =
    editingGroup === 'card' ? '이번 달 사용액 (원)' : editingGroup === 'invest' ? '평가액 (원)' : '잔액 (원)'

  const Footer = (
    <>
      {onDelete ? (
        <button
          className="p-btn p-btn--ghost"
          onClick={onDelete}
          style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
          disabled={isSubmitting}
        >
          <Trash2 size={14} />삭제
        </button>
      ) : (
        <span style={{ marginRight: 'auto' }} />
      )}
      <button className="p-btn p-btn--ghost" onClick={onClose} disabled={isSubmitting}>
        취소
      </button>
      <button
        className="p-btn p-btn--primary"
        onClick={save}
        disabled={(touched && !valid) || isSubmitting}
      >
        {isNew ? '추가' : '저장'}
      </button>
    </>
  )

  const previewInitial = (institution || assetName || '?').charAt(0)

  return (
    <ModalShell title={title} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <div className="cat-edit__preview">
        <span
          className="cat-edit__preview-chip"
          style={{ background: color, color: '#fff', fontWeight: 700, fontSize: 16 }}
        >
          {previewInitial}
        </span>
        <div>
          <div className="cat-edit__preview-label">
            {assetName ||
              (editingGroup === 'account'
                ? '새 계좌'
                : editingGroup === 'card'
                ? '새 카드'
                : '새 투자')}
          </div>
          <div className="cat-edit__preview-sub">{institution || '기관 미지정'} · 미리보기</div>
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">기관·브랜드</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {BANK_PRESETS.map(b => {
            const active = institution === b.k
            return (
              <button
                key={b.k}
                type="button"
                onClick={() => {
                  setInstitution(b.k)
                  setColor(b.color)
                }}
                style={{
                  padding: '10px 4px',
                  background: active ? b.color : 'var(--mist-50)',
                  color: active ? '#fff' : 'var(--fg-secondary)',
                  border: active ? `1px solid ${b.color}` : '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  fontFamily: 'inherit',
                }}
              >
                {b.k}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">{nameLabel}</label>
        <input
          className="p-input"
          value={assetName}
          onChange={e => {
            setAssetName(e.target.value)
            setTouched(true)
          }}
          placeholder={
            editingGroup === 'account'
              ? '예: 신한 주거래'
              : editingGroup === 'card'
              ? '예: 신한 Deep Dream'
              : '예: KODEX 200'
          }
          maxLength={30}
          autoFocus
        />
      </div>

      {editingGroup === 'account' && (
        <div className="p-field" style={{ marginBottom: 14 }}>
          <label className="p-field__label">계좌 종류</label>
          <div className="p-seg">
            {ACCOUNT_SUBTYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`p-seg__btn ${assetType === t.value ? 'active' : ''}`}
                onClick={() => setAssetType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {editingGroup === 'card' && (
        <div className="p-field" style={{ marginBottom: 14 }}>
          <label className="p-field__label">카드 종류</label>
          <div className="p-seg">
            {CARD_SUBTYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`p-seg__btn ${assetType === t.value ? 'active' : ''}`}
                onClick={() => setAssetType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">{balanceLabel}</label>
        <input
          className="p-input num"
          value={balance}
          onChange={e => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          inputMode="numeric"
        />
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">메모 (선택)</label>
        <input
          className="p-input"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="계좌번호 뒷자리, 결제일, 한도 등 메모하세요"
          maxLength={120}
        />
      </div>
    </ModalShell>
  )
}
