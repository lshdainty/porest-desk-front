import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/shared/ui/switch'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
import {
  ALL_HIDE_CARDS,
  cardsOfPage,
  HIDE_PAGES,
  type HideCardKey,
  type HidePageKey,
} from '@/shared/lib/porest/hide-amounts-cards'
import {
  hideCards,
  revealCards,
  useHiddenCards,
} from '@/shared/lib/porest/hide-amounts-core'

/**
 * 금액 숨기기 — 화면(페이지) → 카드 단위로 고르는 설정.
 *
 * <p>예전엔 스위치 하나가 앱 전체 금액을 덮었다. 자산은 가리고 싶어도 가계부는 봐야 하는
 * 경우가 있어서 카드마다 따로 켜고 끈다.
 *
 * <p>가리는 건 자유롭게, <b>푸는 건 비밀번호</b>를 받는다. 페이지·전체 스위치로 풀면
 * 그 묶음을 한 번의 인증으로 처리한다 — 카드마다 비밀번호를 치게 하면 못 쓴다.
 */
export function HideAmountsSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('settings')
  const hiddenCards = useHiddenCards()
  const [searchParams] = useSearchParams()
  /** 화면의 눈 버튼으로 들어오면 그 페이지를 짚어 준다 — 어디를 만져야 할지 바로 보이게. */
  const focusPage = searchParams.get('page') as HidePageKey | null

  /** 인증을 기다리는 해제 대상. 인증되면 통째로 푼다. */
  const [pending, setPending] = useState<HideCardKey[] | null>(null)

  const allOn = hiddenCards.size === ALL_HIDE_CARDS.length
  const anyOn = hiddenCards.size > 0

  const pages = useMemo(
    () => HIDE_PAGES.map(p => ({ page: p, cards: cardsOfPage(p) })),
    [],
  )

  /** 켜기는 그냥, 끄기는 인증을 거쳐서. */
  const apply = (cards: HideCardKey[], next: boolean) => {
    if (next) hideCards(cards)
    else setPending(cards)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 'var(--spacing-xs)' : 'var(--spacing-sm)' }}>
        <SectionLabel>{t('hideAmounts.label')}</SectionLabel>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
          {t('hideAmounts.sectionDesc')}
        </div>
      </div>

      {/* 전체 잠그기 — 34개를 한꺼번에. 풀 때는 인증 한 번. */}
      <ToggleRow
        mobile={mobile}
        emphasis
        icon={anyOn ? <EyeOff size={17} /> : <Eye size={17} />}
        title={t('hideAmounts.lockAll')}
        desc={t('hideAmounts.lockAllDesc', { count: hiddenCards.size, total: ALL_HIDE_CARDS.length })}
        checked={allOn}
        onChange={next => apply(ALL_HIDE_CARDS, next)}
      />

      {pages.map(({ page, cards }) => {
        const on = cards.filter(c => hiddenCards.has(c)).length
        const focused = focusPage === page
        return (
          <section
            key={page}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xs)',
              // 눈 버튼으로 들어온 페이지만 테두리로 짚어 준다.
              ...(focused
                ? {
                    border: '1px solid var(--border-brand)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-sm)',
                  }
                : null),
            }}
          >
            <ToggleRow
              mobile={mobile}
              title={t(`hideAmounts.page.${page}`)}
              desc={t('hideAmounts.pageCount', { on, total: cards.length })}
              checked={on === cards.length}
              /* 일부만 켜진 상태를 스위치로는 못 보여 준다 — 설명 줄의 개수로 알린다. */
              onChange={next => apply(cards, next)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: mobile ? 8 : 12 }}>
              {cards.map(card => (
                <ToggleRow
                  key={card}
                  mobile={mobile}
                  compact
                  title={t(`hideAmounts.card.${card}`)}
                  checked={hiddenCards.has(card)}
                  onChange={next => apply([card], next)}
                />
              ))}
            </div>
          </section>
        )
      })}

      <HideAmountsUnlockDialog
        open={pending !== null}
        onOpenChange={open => {
          if (!open) setPending(null)
        }}
        onVerified={() => {
          if (pending) revealCards(pending)
          setPending(null)
        }}
      />
    </div>
  )
}

function ToggleRow({
  mobile,
  icon,
  title,
  desc,
  checked,
  onChange,
  compact = false,
  emphasis = false,
}: {
  mobile: boolean
  icon?: React.ReactNode
  title: string
  desc?: string
  checked: boolean
  onChange: (next: boolean) => void
  compact?: boolean
  emphasis?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: compact ? '8px 0' : mobile ? '10px 0' : '12px 0',
        ...(emphasis || !compact
          ? { borderBottom: '1px solid var(--border-subtle)' }
          : null),
      }}
    >
      {icon ? (
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
          {icon}
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: compact ? 'var(--text-body-sm)' : 'var(--text-label-sm)',
            fontWeight: compact ? 500 : 600,
            color: compact ? 'var(--fg-secondary)' : 'var(--fg-primary)',
          }}
        >
          {title}
        </div>
        {desc ? (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {desc}
          </div>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  )
}

/** AppearanceSection 과 같은 모양의 섹션 라벨 (로컬 정의라 복제). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-label-sm)',
        fontWeight: '600',
        color: 'var(--fg-secondary)',
      }}
    >
      {children}
    </div>
  )
}
