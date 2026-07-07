import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import { useHasSecurities } from '@/features/subscription/model/useSubscription'
import {
  Bookmark,
  Calendar1,
  ChartPie,
  ChevronRight,
  CreditCard,
  Download,
  SquareCheckBig,
  FileText,
  Palette,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  Tag,
  FilePen,
  TrendingUp,
  Users,
  Wallet,
  Bell,
  User,
} from 'lucide-react'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

interface NavItem {
  labelKey: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  path: string
  descKey: string
}

interface NavGroup {
  labelKey: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    labelKey: 'group.money',
    items: [
      { labelKey: 'item.expense', icon: ReceiptText, path: '/desk/expense', descKey: 'desc.expense' },
      { labelKey: 'item.asset', icon: Wallet, path: '/desk/asset', descKey: 'desc.asset' },
      { labelKey: 'item.stocks', icon: TrendingUp, path: '/desk/stocks', descKey: 'desc.stocks' },
      { labelKey: 'item.budget', icon: FilePen, path: '/desk/budget', descKey: 'desc.budget' },
      { labelKey: 'item.stats', icon: ChartPie, path: '/desk/stats', descKey: 'desc.stats' },
      { labelKey: 'item.recurring', icon: Repeat, path: '/desk/settings?section=recurring', descKey: 'desc.recurring' },
      { labelKey: 'item.accounts', icon: CreditCard, path: '/desk/settings?section=accounts', descKey: 'desc.accounts' },
    ],
  },
  {
    labelKey: 'group.daily',
    items: [
      { labelKey: 'item.calendar', icon: Calendar1, path: '/desk/calendar', descKey: 'desc.calendar' },
      { labelKey: 'item.todo', icon: SquareCheckBig, path: '/desk/todo', descKey: 'desc.todo' },
      { labelKey: 'item.memo', icon: FileText, path: '/desk/memo', descKey: 'desc.memo' },
      { labelKey: 'item.dutchPay', icon: Users, path: '/desk/dutch-pay', descKey: 'desc.dutchPay' },
      { labelKey: 'item.cardBenefit', icon: CreditCard, path: '/desk/card-benefit', descKey: 'desc.cardBenefit' },
    ],
  },
  {
    labelKey: 'group.personal',
    items: [
      { labelKey: 'item.categories', icon: Tag, path: '/desk/settings?section=categories', descKey: 'desc.categories' },
      { labelKey: 'item.presets', icon: Bookmark, path: '/desk/settings?section=presets', descKey: 'desc.presets' },
      { labelKey: 'item.appearance', icon: Palette, path: '/desk/settings?section=appearance', descKey: 'desc.appearance' },
    ],
  },
  {
    labelKey: 'group.system',
    items: [
      { labelKey: 'item.settings', icon: Settings, path: '/desk/settings', descKey: 'desc.settings' },
      { labelKey: 'item.notifications', icon: Bell, path: '/desk/notifications', descKey: 'desc.notifications' },
      { labelKey: 'item.dataExport', icon: Download, path: '/desk/settings?section=data', descKey: 'desc.dataExport' },
      { labelKey: 'item.account', icon: User, path: '/desk/settings?section=account', descKey: 'desc.account' },
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

  const allItems: NavItem[] = visibleGroups.flatMap(g => g.items)

  const filteredItems = query.trim()
    ? allItems.filter(item =>
        t(item.labelKey).toLowerCase().includes(query.toLowerCase()) ||
        t(item.descKey).toLowerCase().includes(query.toLowerCase()),
      )
    : null

  const isSearching = query.trim().length > 0

  return (
    <div className="px-5 pb-8" style={{ paddingTop: 20 }}>
      {/* 검색바 */}
      <div className="relative mb-5">
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
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

      {/* 검색 결과 */}
      {isSearching && (
        <div>
          {filteredItems && filteredItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                fontSize: 14,
                color: 'var(--fg-tertiary)',
              }}
            >
              {t('noResults')}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-sm)',
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
              }}
            >
              {filteredItems?.map((item, idx) => {
                const IconComp = item.icon
                const isLast = idx === (filteredItems?.length ?? 0) - 1
                return (
                  <button
                    key={`${item.path}-${idx}`}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '14px 16px',
                      border: 0,
                      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)'
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    }}
                  >
                    <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                      <IconComp size={18} strokeWidth={1.8} color="var(--fg-secondary)" />
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--fg-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t(item.labelKey)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginRight: 4 }}>
                      {t(item.descKey)}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 그룹 리스트 — 검색 비활성일 때만 */}
      {!isSearching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {visibleGroups.map(group => (
            <div key={group.labelKey}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--fg-primary)',
                  paddingBottom: 8,
                  paddingLeft: 2,
                }}
              >
                {t(group.labelKey)}
              </div>
              <div
                style={{
                  background: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                }}
              >
                {group.items.map((item, idx) => {
                  const IconComp = item.icon
                  const isLast = idx === group.items.length - 1
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '14px 16px',
                        border: 0,
                        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      }}
                    >
                      <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                        <IconComp size={18} strokeWidth={1.8} color="var(--fg-secondary)" />
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--fg-primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {item.label}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginRight: 4 }}>
                        {item.desc}
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
