import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useCreateTrade } from '@/features/asset'
import { useStockSymbolName } from '@/features/stock/model/useStockMaster'
import { sanitizeQty, qtyNumber, formatQty } from '@/entities/asset'
import type { Asset, AssetHolding, TradeType } from '@/entities/asset'
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
  holding,
  defaultType = 'BUY',
  mobile,
  onClose,
}: {
  asset: Asset
  /** 어떤 종목인지 정해진 채로 들어온다 — 여기서 다시 고르게 하면 편집과 역할이 겹친다. */
  holding: AssetHolding
  defaultType?: TradeType
  mobile: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const createMut = useCreateTrade()

  const [type, setType] = useState<Exclude<TradeType, 'OPENING'>>(
    defaultType === 'SELL' ? 'SELL' : 'BUY',
  )
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState('')
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [description, setDescription] = useState('')

  const isSell = type === 'SELL'
  // 종목 식별자 — 연동은 토스 종목코드, 미연동은 항목명. 보유 목록은 편집할 때마다
  // 통째로 재생성돼서 rowId 로는 거래를 묶을 수 없다.
  const holdingKey = (holding.linked ? holding.tossSymbol : holding.holdingName) ?? ''
  // 티커가 아니라 종목명으로 보여 준다 — 편집 화면과 같은 이름이어야 헷갈리지 않는다.
  const { data: masterName } = useStockSymbolName(holding.linked ? holding.tossSymbol ?? '' : '')
  const holdingName = holding.linked
    ? masterName ?? holding.tossSymbol ?? ''
    : holding.holdingName ?? ''

  const qty = qtyNumber(quantity) ?? 0
  const amountNum = Number(amount.replace(/[^\d]/g, '')) || 0
  const feeNum = Number(fee.replace(/[^\d]/g, '')) || 0

  // 예수금이 어떻게 움직이는지 미리 보여 준다 — 매수는 수수료까지 빠지고 매도는 떼고 들어온다.
  const cashDelta = isSell ? amountNum - feeNum : -(amountNum + feeNum)
  const cashAfter = (asset.cashBalance ?? 0) + cashDelta

  // 매도는 판 만큼의 원가를 빼야 손익이 나온다 — 서버와 같은 비율 계산으로 미리 보여 준다.
  const heldQty = qtyNumber(holding.quantity) ?? 0
  const realizedPreview = useMemo(() => {
    if (!isSell || heldQty <= 0 || qty <= 0) return null
    const soldCost = Math.round(((holding.totalCost ?? 0) * qty) / heldQty)
    return amountNum - feeNum - soldCost
  }, [isSell, holding.totalCost, heldQty, qty, amountNum, feeNum])

  const canSubmit =
    holdingKey.length > 0 && qty > 0 && amountNum > 0 &&
    (!isSell || qty <= heldQty) &&
    (isSell || cashAfter >= 0)

  const submit = () => {
    if (!canSubmit) return
    createMut.mutate(
      {
        assetRowId: asset.rowId,
        tradeType: type,
        holdingType: holding.holdingType ?? 'STOCK',
        holdingKey,
        linked: holding.linked,
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
        }}
        className="mb-[14px]"
      >
        <TabsList variant="pill" size="sm" className="w-full">
          <TabsTrigger value="BUY" className="flex-1">{t('trade.buy')}</TabsTrigger>
          <TabsTrigger value="SELL" className="flex-1">{t('trade.sell')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 어떤 종목인지 — 여기서 고르는 게 아니라 이미 정해져서 들어온다.
          종목 추가는 편집(토스 검색)에서 한다. */}
      <div
        className="mb-[14px] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2.5"
      >
        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700 }}>{holdingName}</div>
        <div className="mt-0.5 text-[11.5px] text-[var(--fg-tertiary)]">
          {t('trade.heldSummary', {
            qty: formatQty(holding.quantity, holding.holdingType ?? 'STOCK'),
            avg: holding.avgPrice ? KRW(Math.round(Number(holding.avgPrice))) : '—',
          })}
        </div>
      </div>

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
        {isSell && qty > heldQty && (
          <div className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-error)' }}>
            {t('trade.insufficientQty')}
          </div>
        )}
      </div>
    </ModalShell>
  )
}
