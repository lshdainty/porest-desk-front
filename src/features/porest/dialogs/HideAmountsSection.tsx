import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Eye, EyeOff, Lock } from 'lucide-react'
import { Switch } from '@/shared/ui/switch'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
import {
  ALL_HIDE_CARDS,
  cardsOfPage,
  HIDE_PAGES,
  type HideCardKey,
} from '@/shared/lib/porest/hide-amounts-cards'
import {
  hideCards,
  revealCards,
  useHiddenCards,
} from '@/shared/lib/porest/hide-amounts-core'

/**
 * 금액 가리기 — 표시 설정 '개인정보 보호' 안의 아코디언 (porest-design `hide-amounts.jsx` 미러).
 *
 * <p>예전엔 스위치 하나가 앱 전체 금액을 덮었다. 자산은 가리고 싶어도 가계부는 봐야 하는
 * 경우가 있어서 화면(8) → 카드(37) 로 쪼갰다.
 *
 * <p>가리는 건 자유롭게, <b>푸는 건 비밀번호</b>를 받는다. 전체·페이지 스위치로 풀면 그
 * 묶음을 한 번의 인증으로 처리한다 — 카드마다 비밀번호를 치게 하면 못 쓴다.
 */
export function HideAmountsSection({
  mobile,
  defaultOpen = false,
}: {
  mobile: boolean
  /** 화면의 눈 버튼으로 들어오면 펼친 채로 연다 — 접힌 아코디언만 보이면 헛걸음이 된다. */
  defaultOpen?: boolean
}) {
  const { t } = useTranslation('settings')
  const hidden = useHiddenCards()
  const [open, setOpen] = useState(defaultOpen)
  /** 인증을 기다리는 해제 대상. 인증되면 통째로 푼다. */
  const [pending, setPending] = useState<HideCardKey[] | null>(null)

  const total = ALL_HIDE_CARDS.length
  const hiddenCount = hidden.size
  const allOn = hiddenCount === total

  const pages = useMemo(
    () => HIDE_PAGES.map(p => ({ page: p, cards: cardsOfPage(p) })),
    [],
  )

  /** 켜기는 그냥, 끄기는 인증을 거쳐서. */
  const apply = (cards: HideCardKey[], next: boolean) => {
    if (next) hideCards(cards)
    else setPending(cards)
  }

  const descText = (
    <div
      style={{
        fontSize: mobile ? 'var(--text-caption)' : 'var(--text-badge)',
        color: 'var(--fg-tertiary)',
        lineHeight: 1.55,
        padding: mobile ? '2px 0 4px' : '10px 0 2px',
      }}
    >
      {t('hideAmounts.sectionDesc')}
    </div>
  )

  // ── 전체 잠그기 마스터
  const masterRow = (pad: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: pad }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-full)',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: allOn ? 'var(--bg-brand-subtle)' : 'var(--bg-sunken)',
          color: allOn ? 'var(--fg-brand)' : 'var(--fg-secondary)',
        }}
      >
        <Lock size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: mobile ? 'var(--text-body-sm)' : 'var(--text-label-sm)',
            fontWeight: 700,
            color: 'var(--fg-primary)',
          }}
        >
          {t('hideAmounts.lockAll')}
        </div>
        <div
          className="num"
          style={{
            fontSize: mobile ? 'var(--text-caption)' : 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
            marginTop: 2,
          }}
        >
          {t('hideAmounts.lockAllDesc', { count: hiddenCount, total })}
        </div>
      </div>
      <Switch
        checked={allOn}
        onCheckedChange={next => apply(ALL_HIDE_CARDS, next)}
        aria-label={t('hideAmounts.lockAll')}
      />
    </div>
  )

  // ── 그룹 목록 (전체 잠금이면 만질 필요가 없다 — 물러나 있게)
  const groups = (
    <div
      style={{
        opacity: allOn ? 0.55 : 1,
        pointerEvents: allOn ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: mobile ? 0 : 10,
      }}
    >
      {pages.map(({ page, cards }) => {
        const on = cards.filter(c => hidden.has(c)).length
        const groupOn = on === cards.length
        return mobile ? (
          <div key={page} style={{ marginTop: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '4px 0 12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                  {t(`hideAmounts.page.${page}`)}
                </div>
                <div className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                  {on} / {cards.length}
                </div>
              </div>
              <Switch checked={groupOn} onCheckedChange={next => apply(cards, next)} />
            </div>
            {cards.map(card => (
              <div
                key={card}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0 14px 10px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ flex: 1, fontSize: 'var(--text-body-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>
                  {t(`hideAmounts.card.${card}`)}
                </span>
                <Switch checked={hidden.has(card)} onCheckedChange={next => apply([card], next)} />
              </div>
            ))}
          </div>
        ) : (
          <div
            key={page}
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px 13px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                  {t(`hideAmounts.page.${page}`)}
                </div>
                <div className="num" style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                  {on} / {cards.length}
                </div>
              </div>
              <Switch checked={groupOn} onCheckedChange={next => apply(cards, next)} />
            </div>
            {cards.map(card => (
              <div
                key={card}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ flex: 1, fontSize: 'var(--text-label-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>
                  {t(`hideAmounts.card.${card}`)}
                </span>
                <Switch checked={hidden.has(card)} onCheckedChange={next => apply([card], next)} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      {/* 아코디언 트리거 — 접혀 있을 때도 몇 장을 가렸는지 보인다. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(o => !o)
          }
        }}
        style={
          mobile
            ? { padding: '12px 6px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }
            : {
                background: 'var(--bg-surface)',
                borderRadius: open
                  ? 'var(--radius-lg) var(--radius-lg) 0 0'
                  : 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }
        }
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-sunken)',
            color: 'var(--fg-secondary)',
          }}
        >
          {hiddenCount > 0 ? <EyeOff size={17} /> : <Eye size={17} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: mobile ? 'var(--text-body-lg)' : 'var(--text-label-sm)',
              fontWeight: 600,
              color: 'var(--fg-primary)',
            }}
          >
            {t('hideAmounts.label')}
          </div>
          <div
            style={{
              fontSize: mobile ? 'var(--text-caption)' : 'var(--text-badge)',
              color: 'var(--fg-tertiary)',
              marginTop: 2,
            }}
          >
            {t('hideAmounts.desc')}
          </div>
        </div>
        <span
          className="num"
          style={{
            fontSize: 'var(--text-caption)',
            fontWeight: 600,
            color: hiddenCount > 0 ? 'var(--fg-brand)' : 'var(--fg-tertiary)',
            flexShrink: 0,
          }}
        >
          {hiddenCount} / {total}
        </span>
        <span
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            color: 'var(--fg-tertiary)',
            transform: open ? 'rotate(-180deg)' : 'none',
            transition: 'transform var(--motion-duration-base) var(--motion-ease-out)',
          }}
        >
          <ChevronDown size={17} />
        </span>
      </div>

      {open &&
        (mobile ? (
          <div style={{ padding: '2px 6px 4px' }}>
            {descText}
            {masterRow('12px 0')}
            <div style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            {groups}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: '4px 16px 16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {descText}
            {masterRow('12px 0 14px')}
            {groups}
          </div>
        ))}

      <HideAmountsUnlockDialog
        open={pending !== null}
        onOpenChange={o => {
          if (!o) setPending(null)
        }}
        onVerified={() => {
          if (pending) revealCards(pending)
          setPending(null)
        }}
      />
    </div>
  )
}
