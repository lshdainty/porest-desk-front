import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Input } from '@/shared/ui/input'
import {
  Bookmark,
  Calendar1,
  ChartPie,
  ChevronRight,
  CreditCard,
  Download,
  ListChecks,
  NotebookPen,
  Palette,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  Tag,
  FilePen,
  UsersRound,
  Wallet,
  Bell,
  User,
} from 'lucide-react'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

interface NavItem {
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  path: string
  desc: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    label: '돈 관리',
    items: [
      { label: '가계부', icon: ReceiptText, path: '/desk/expense', desc: '지출 · 수입 · 이체' },
      { label: '자산', icon: Wallet, path: '/desk/asset', desc: '계좌 · 카드 · 투자 · 부채' },
      { label: '예산', icon: FilePen, path: '/desk/budget', desc: '월간 · 카테고리별' },
      { label: '통계·분석', icon: ChartPie, path: '/desk/stats', desc: '카테고리 · 트렌드 · 비교' },
      { label: '반복 거래', icon: Repeat, path: '/desk/settings?section=recurring', desc: '구독 · 고정비' },
      { label: '계좌·카드 관리', icon: CreditCard, path: '/desk/settings?section=accounts', desc: '연결된 계좌 · 카드 관리' },
    ],
  },
  {
    label: '일상',
    items: [
      { label: '캘린더', icon: Calendar1, path: '/desk/calendar', desc: '일정 · 반복 · 알림' },
      { label: '할 일', icon: ListChecks, path: '/desk/todo', desc: '마감 · 우선순위 · 태그' },
      { label: '메모', icon: NotebookPen, path: '/desk/memo', desc: '분류 · 고정 · 검색' },
      { label: '더치페이', icon: UsersRound, path: '/desk/dutch-pay', desc: '정산 · 친구 · 송금 요청' },
      { label: '카드 혜택', icon: CreditCard, path: '/desk/card-benefit', desc: '신용·체크 카드 검색' },
    ],
  },
  {
    label: '개인화',
    items: [
      { label: '카테고리', icon: Tag, path: '/desk/settings?section=categories', desc: '지출 · 수입' },
      { label: '프리셋', icon: Bookmark, path: '/desk/settings?section=presets', desc: '자주 쓰는 내역' },
      { label: '표시 설정', icon: Palette, path: '/desk/settings?section=appearance', desc: '테마 · 밀도 · 통화' },
    ],
  },
  {
    label: '계정·시스템',
    items: [
      { label: '설정', icon: Settings, path: '/desk/settings', desc: '전체 설정 메뉴' },
      { label: '알림', icon: Bell, path: '/desk/notifications', desc: '푸시 · 이메일 · 방해 금지' },
      { label: '데이터 내보내기', icon: Download, path: '/desk/settings?section=data', desc: 'CSV · Excel · PDF · 자동 백업' },
      { label: '계정', icon: User, path: '/desk/settings?section=account', desc: '프로필 · 보안 · 구독' },
    ],
  },
]

export const MorePage = () => {
  const navigate = useNavigate()
  useOutletContext<OutletCtx>()
  const [query, setQuery] = useState('')

  const allItems: NavItem[] = GROUPS.flatMap(g => g.items)

  const filteredItems = query.trim()
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()),
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
          placeholder="메뉴 검색"
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
              검색 결과가 없습니다
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
          )}
        </div>
      )}

      {/* 그룹 리스트 — 검색 비활성일 때만 */}
      {!isSearching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {GROUPS.map(group => (
            <div key={group.label}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--fg-primary)',
                  paddingBottom: 8,
                  paddingLeft: 2,
                }}
              >
                {group.label}
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
