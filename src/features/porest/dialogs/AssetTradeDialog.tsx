import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useCreateTrade } from '@/features/asset'
import { HOLDING_TYPES, sanitizeQty, qtyNumber } from '@/entities/asset'
import type { Asset, AssetHolding, HoldingType, TradeType } from '@/entities/asset'
import { KRW } from '@/shared/lib/porest/format'

/**
 * 매수·매도 입력.
 *
 * <p>예수금이 줄고 느는 진짜 사건을 여기서 기록한다. 이게 없으면 평가액 갱신을 보고
 * 예수금을 추측해야 하는데, 시세 변동·추가 매수·재등록이 전부 같은 갱신으로 들어와
 * 구분되지 않는다.
 *
 * <p>거래대금은 수수료를 뺀 순수 금액이다. 수수료는 매수면 취득원가에 들어가고 매도면
 * 대금에서 빠진다 — 어느 쪽이든 예수금에서 실제로 나간다.
 */
export function AssetTradeDialog({
  asset,
  holdings,
  defaultType = 'BUY',
  defaultHoldingKey,
  mobile,
  onClose,
}: {
  asset: Asset
  holdings: AssetHolding[]
  defaultType?: TradeType
  defaultHoldingKey?: string
  mobile: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const createMut = useCreateTrade()

  const [type, setType] = useState<Exclude<TradeType, 'OPENING'>>(
    defaultType === 'SELL' ? 'SELL' : 'BUY',
  )
  // 보유 종목의 식별자 — 연동은 토스 종목코드, 미연동은 항목명. 보유 목록은 편집할 때마다
  // 통째로 재생성돼서 rowId 로는 거래를 묶을 수 없다.
  const keyOf = (h: AssetHolding) => (h.linked ? h.tossSymbol ?? '' : h.holdingName ?? '')
  const options = useMemo(
    () => holdings.filter(h => keyOf(h).length > 0),
    [holdings],
  )

  const [holdingKey, setHoldingKey] = useState<string>(
    defaultHoldingKey ?? (options[0] ? keyOf(options[0]) : ''),
  )
  const [newKey, setNewKey] = useState('')
  const [newType, setNewType] = useState<HoldingType>('STOCK')
  // 매수는 새 종목을 들일 수 있다. 매도는 보유한 것만.
  const [addNew, setAddNew] = useState(options.length === 0)

  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState('')
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [description, setDescription] = useState('')

  const isSell = type === 'SELL'
  const picked = options.find(h => keyOf(h) === holdingKey) ?? null
  const useNew = !isSell && addNew

  const qty = qtyNumber(quantity) ?? 0
  const amountNum = Number(amount.replace(/[^\d]/g, '')) || 0
  const feeNum = Number(fee.replace(/[^\d]/g, '')) || 0

  // 예수금이 어떻게 움직이는지 미리 보여 준다 — 매수는 수수료까지 빠지고 매도는 떼고 들어온다.
  const cashDelta = isSell ? amountNum - feeNum : -(amountNum + feeNum)
  const cashAfter = (asset.cashBalance ?? 0) + cashDelta

  // 매도는 판 만큼의 원가를 빼야 손익이 나온다 — 서버와 같은 비율 계산으로 미리 보여 준다.
  const heldQty = picked ? qtyNumber(picked.quantity) ?? 0 : 0
  const realizedPreview = useMemo(() => {
    if (!isSell || !picked || heldQty <= 0 || qty <= 0) return null
    const soldCost = Math.round(((picked.totalCost ?? 0) * qty) / heldQty)
    return amountNum - feeNum - soldCost
  }, [isSell, picked, heldQty, qty, amountNum, feeNum])

  const resolvedKey = useNew ? newKey.trim() : holdingKey
  const canSubmit =
    resolvedKey.length > 0 && qty > 0 && amountNum > 0 &&
    (!isSell || (picked != null && qty <= heldQty)) &&
    (isSell || cashAfter >= 0)

  const submit = () => {
    if (!canSubmit) return
    createMut.mutate(
      {
        assetRowId: asset.rowId,
        tradeType: type,
        holdingType: useNew ? newType : picked?.holdingType ?? 'STOCK',
        holdingKey: resolvedKey,
        // 새로 들이는 종목은 수동 입력이다 — 토스 연동은 종목 검색을 거쳐야 해서 편집 화면에서 붙인다.
        linked: useNew ? false : picked?.linked ?? false,
        quantity: sanitizeQty(quantity),
        amount: amountNum,
        fee: feeNum,
        tradeDate: `${tradeDate}:00`,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(isSell ? t('trade.sold') : t('trade.bought'))
          onClose()
        },
        // onError: 전역 인터셉터가 서버 메시지를 토스트로 노출(예수금 부족·수량 부족 등)
      },
    )
  }

  return (
    <ModalShell
      title={t('trade.title')}
      onClose={onClose}
      size="sm"
      mobile={mobile}
      footer={
        <ModalFooter
          onCancel={onClose}
          cancelLabel={tc('cancel')}
          onSave={submit}
          saveLabel={isSell ? t('trade.actionSell') : t('trade.actionBuy')}
          saving={createMut.isPending}
          saveDisabled={!canSubmit}
        />
      }
    >
      <Tabs
        value={type}
        onValueChange={v => {
          if (!v) return
          setType(v as typeof type)
          if (v === 'SELL') setAddNew(false)
        }}
        className="mb-[14px]"
      >
        <TabsList variant="pill" size="sm" className="w-full">
          <TabsTrigger value="BUY" className="flex-1">{t('trade.buy')}</TabsTrigger>
          <TabsTrigger value="SELL" className="flex-1">{t('trade.sell')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Field className="mb-[14px]">
        <FieldLabel>{t('trade.holding')}</FieldLabel>
        {useNew ? (
          <>
            <Input
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder={t('trade.newHoldingPlaceholder')}
              maxLength={100}
              autoFocus
            />
            <div className="mt-2">
              <Select value={newType} onValueChange={v => setNewType(v as HoldingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOLDING_TYPES.map(ht => (
                    <SelectItem key={ht.type} value={ht.type}>{t(ht.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <Select value={holdingKey} onValueChange={setHoldingKey} disabled={options.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={t('trade.noHolding')} />
            </SelectTrigger>
            <SelectContent>
              {options.map(h => (
                <SelectItem key={keyOf(h)} value={keyOf(h)}>
                  {h.linked ? h.tossSymbol : h.holdingName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!isSell && options.length > 0 && (
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="mt-1.5 self-start"
            onClick={() => setAddNew(v => !v)}
          >
            {useNew ? t('trade.pickExisting') : t('trade.addNewHolding')}
          </Button>
        )}
        {isSell && picked && (
          <div className="mt-1.5 text-[11.5px] text-[var(--fg-tertiary)]">
            {t('trade.heldSummary', {
              qty: picked.quantity ?? '0',
              avg: picked.avgPrice ? KRW(Math.round(Number(picked.avgPrice))) : '—',
            })}
          </div>
        )}
      </Field>

      <Field className="mb-[14px]">
        <FieldLabel>{t('trade.quantity')}</FieldLabel>
        <Input
          value={quantity}
          onChange={e => setQuantity(sanitizeQty(e.target.value))}
          inputMode="decimal"
          placeholder="0"
        />
      </Field>

      <Field className="mb-[14px]">
        <FieldLabel>{t('trade.amount')}</FieldLabel>
        <Input
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          inputMode="numeric"
          placeholder="0"
        />
        <div className="mt-1.5 text-[11.5px] text-[var(--fg-tertiary)]">{t('trade.amountHelp')}</div>
      </Field>

      <Field className="mb-[14px]">
        <FieldLabel>{t('trade.fee')}</FieldLabel>
        <Input
          value={fee}
          onChange={e => setFee(e.target.value.replace(/[^\d]/g, ''))}
          inputMode="numeric"
          placeholder="0"
        />
      </Field>

      <Field className="mb-[14px]">
        <FieldLabel>{t('trade.date')}</FieldLabel>
        <Input type="datetime-local" value={tradeDate} onChange={e => setTradeDate(e.target.value)} />
      </Field>

      <Field className="mb-[14px]">
        <FieldLabel>{t('trade.memo')}</FieldLabel>
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('trade.memoPlaceholder')}
          maxLength={200}
        />
      </Field>

      {/* 예수금이 어떻게 되는지 먼저 보여 준다 — 저장하고 나서 놀라지 않게. */}
      <div
        className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2.5"
        style={{ fontSize: 'var(--text-body-sm)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[var(--fg-secondary)]">{t('trade.cashAfter')}</span>
          <span
            className="num font-bold"
            style={{ color: cashAfter < 0 ? 'var(--color-error)' : 'var(--fg-primary)' }}
          >
            {KRW(cashAfter)}원
          </span>
        </div>
        {realizedPreview != null && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[var(--fg-secondary)]">{t('trade.realizedPreview')}</span>
            <span
              className="num font-bold"
              style={{ color: realizedPreview >= 0 ? 'var(--fg-income)' : 'var(--fg-expense)' }}
            >
              {realizedPreview >= 0 ? '+' : '−'}{KRW(Math.abs(realizedPreview))}원
            </span>
          </div>
        )}
        {!isSell && cashAfter < 0 && (
          <div className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-error)' }}>
            {t('trade.insufficientCash')}
          </div>
        )}
        {isSell && picked && qty > heldQty && (
          <div className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-error)' }}>
            {t('trade.insufficientQty')}
          </div>
        )}
      </div>
    </ModalShell>
  )
}
