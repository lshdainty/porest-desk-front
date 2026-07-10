import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import { useHasSecurities } from '@/features/subscription/model/useSubscription'
import { Search, SearchX } from 'lucide-react'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

interface NavItem {
  labelKey: string
  path: string
  descKey: string
}

interface NavGroup {
  labelKey: string
  items: NavItem[]
}

// K뱅크 톤 전체 메뉴 — 카드·아이콘·설명 행 없이 그룹 라벨 + 2열 텍스트 링크
// (design chrome.jsx MoreScreen SoT — 모바일 카드 다이어트).
const GROUPS: NavGroup[] = [
  {
    labelKey: 'group.money',
    items: [
      { labelKey: 'item.expense', path: '/desk/expense', descKey: 'desc.expense' },
      { labelKey: 'item.asset', path: '/desk/asset', descKey: 'desc.asset' },
      { labelKey: 'item.stocks', path: '/desk/stocks', descKey: 'desc.stocks' },
      { labelKey: 'item.budget', path: '/desk/budget', descKey: 'desc.budget' },
      { labelKey: 'item.stats', path: '/desk/stats', descKey: 'desc.stats' },
      { labelKey: 'item.recurring', path: '/desk/settings?section=recurring', descKey: 'desc.recurring' },
      { labelKey: 'item.accounts', path: '/desk/settings?section=accounts', descKey: 'desc.accounts' },
    ],
  },
  {
    labelKey: 'group.daily',
    items: [
      { labelKey: 'item.calendar', path: '/desk/calendar', descKey: 'desc.calendar' },
      { labelKey: 'item.todo', path: '/desk/todo', descKey: 'desc.todo' },
      { labelKey: 'item.memo', path: '/desk/memo', descKey: 'desc.memo' },
      { labelKey: 'item.dutchPay', path: '/desk/dutch-pay', descKey: 'desc.dutchPay' },
      { labelKey: 'item.cardBenefit', path: '/desk/card-benefit', descKey: 'desc.cardBenefit' },
    ],
  },
  {
    labelKey: 'group.personal',
    items: [
      { labelKey: 'item.categories', path: '/desk/settings?section=categories', descKey: 'desc.categories' },
      { labelKey: 'item.presets', path: '/desk/settings?section=presets', descKey: 'desc.presets' },
      { labelKey: 'item.appearance', path: '/desk/settings?section=appearance', descKey: 'desc.appearance' },
    ],
  },
  {
    labelKey: 'group.system',
    items: [
      { labelKey: 'item.settings', path: '/desk/settings', descKey: 'desc.settings' },
      { labelKey: 'item.notifications', path: '/desk/notifications', descKey: 'desc.notifications' },
      { labelKey: 'item.dataExport', path: '/desk/settings?section=data', descKey: 'desc.dataExport' },
      { labelKey: 'item.account', path: '/desk/settings?section=account', descKey: 'desc.account' },
    ],
  },
]

export const MorePage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('more')
  useOutletContext<OutletCtx>()
  const [query, setQuery] = useState('')
  const hasSecurities = useHasSecurities()

  // 증권 메뉴는 구독(SECURITIES) 보유 시에만 노출
  const visibleGroups: NavGroup[] = hasSecurities
    ? GROUPS
    : GROUPS.map(g => ({ ...g, items: g.items.filter(i => i.path !== '/desk/stocks') }))

  // 검색 — 그룹 구조를 유지한 채 항목 필터 (design MoreScreen 정합)
  const q = query.trim().toLowerCase()
  const filtered = q
    ? visibleGroups
        .map(g => ({
          ...g,
          items: g.items.filter(
            item =>
              t(item.labelKey).toLowerCase().includes(q) ||
              t(item.descKey).toLowerCase().includes(q),
          ),
        }))
        .filter(g => g.items.length > 0)
    : visibleGroups

  return (
    <div style={{ padding: '20px 0 32px' }}>
      {/* 검색바 */}
      <div className="relative" style={{ padding: '0 20px', marginBottom: 4 }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 32,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--fg-tertiary)',
            pointerEvents: 'none',
          }}
        />
        <Input
          search
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('search')}
          className="w-full pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
          }}
        >
          <SearchX size={28} style={{ display: 'inline-block' }} />
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600, marginTop: 8 }}>{t('noResults')}</div>
        </div>
      ) : (
        filtered.map((group, gi) => (
          <div key={group.labelKey}>
            {/* 그룹 사이 헤어라인 (design .flat-div) */}
            {gi > 0 && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 20px' }} />}
            <div
              style={{
                fontSize: 'var(--text-body-lg)',
                fontWeight: 700,
                color: 'var(--fg-primary)',
                letterSpacing: '-0.01em',
                padding: '14px 20px 2px',
              }}
            >
              {t(group.labelKey)}
            </div>
            {/* K뱅크 스타일 — 카드 없이 2열 텍스트 링크 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                padding: '6px 20px 4px',
                columnGap: 16,
              }}
            >
              {group.items.map(item => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '13px 0',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'var(--fg-primary)',
                    fontFamily: 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onTouchStart={e => {
                    e.currentTarget.style.opacity = '0.55'
                  }}
                  onTouchEnd={e => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.7'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
