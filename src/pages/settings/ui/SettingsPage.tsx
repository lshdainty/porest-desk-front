import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Palette,
  Repeat,
  Settings,
  Tag,
  Target,
  User,
  Wallet,
} from 'lucide-react'
import {
  AccountManager,
  AppearanceSection,
  BudgetManager,
  CategoryManager,
  NotificationsManager,
  PresetManager,
  RecurringManager,
} from '@/features/porest/dialogs'

type OutletCtx = { onAddTx: () => void; mobile: boolean }
type SectionId =
  | 'categories'
  | 'accounts'
  | 'budget'
  | 'recurring'
  | 'presets'
  | 'appearance'
  | 'notifications'
  | 'data'
  | 'account'

interface SectionDef {
  id: SectionId
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  desc: string
}

const SECTIONS: SectionDef[] = [
  { id: 'categories', label: '카테고리 관리', icon: Tag, desc: '지출·수입 카테고리 추가·수정·삭제' },
  { id: 'accounts', label: '계좌·카드 관리', icon: Wallet, desc: '연결된 계좌와 카드 관리' },
  { id: 'budget', label: '예산 설정', icon: Target, desc: '월간 예산 및 카테고리별 한도' },
  { id: 'recurring', label: '반복 거래 관리', icon: Repeat, desc: '구독·고정 결제·정기 수입 일괄 관리' },
  { id: 'presets', label: '프리셋 관리', icon: Bookmark, desc: '자주 쓰는 내역을 한 번 탭으로 채우기' },
  { id: 'appearance', label: '표시 설정', icon: Palette, desc: '테마·밀도·기본 통화' },
  { id: 'notifications', label: '알림', icon: Bell, desc: '결제 예정·예산 초과 알림' },
  { id: 'data', label: '데이터 내보내기', icon: Download, desc: 'CSV·PDF로 거래 내역 백업' },
  { id: 'account', label: '계정', icon: User, desc: '프로필·보안·로그아웃' },
]

const SECTION_IDS: SectionId[] = SECTIONS.map(s => s.id)

export const SettingsPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const [searchParams, setSearchParams] = useSearchParams()

  const querySection = (() => {
    const q = searchParams.get('section')
    return q && (SECTION_IDS as string[]).includes(q) ? (q as SectionId) : null
  })()
  const [section, setSection] = useState<SectionId | 'menu'>(
    querySection ?? (mobile ? 'menu' : 'categories'),
  )

  // URL 쿼리 변화를 섹션 상태에 반영 (외부에서 딥링크 들어오면 스위치).
  useEffect(() => {
    if (querySection && querySection !== section) setSection(querySection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // 섹션 변경 시 URL 동기화 (뒤로가기 정합성).
  const changeSection = (next: SectionId | 'menu') => {
    setSection(next)
    const p = new URLSearchParams(searchParams)
    if (next === 'menu') p.delete('section')
    else p.set('section', next)
    setSearchParams(p, { replace: true })
  }

  const activeSection = section === 'menu' ? null : SECTIONS.find(s => s.id === section) ?? null

  const renderBody = (m: boolean) => {
    if (!activeSection) return null
    switch (activeSection.id) {
      case 'categories':    return <CategoryManager mobile={m} />
      case 'accounts':      return <AccountManager mobile={m} />
      case 'budget':        return <BudgetManager mobile={m} />
      case 'recurring':     return <RecurringManager mobile={m} />
      case 'presets':       return <PresetManager mobile={m} />
      case 'appearance':    return <AppearanceSection mobile={m} />
      case 'notifications': return <NotificationsManager mobile={m} />
      default:              return <PlaceholderSection section={activeSection} />
    }
  }

  if (mobile) {
    if (section === 'menu') {
      return (
        <div style={{ padding: '4px 0 24px' }}>
          <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} style={{ color: 'var(--fg-secondary)' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>설정</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-surface)',
              borderRadius: 14,
              margin: '0 12px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {SECTIONS.map(s => {
              const IconComp = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => changeSection(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: 0,
                    background: 'transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--bg-brand-subtle)',
                      color: 'var(--fg-brand-strong)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={18} strokeWidth={1.9} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--fg-tertiary)' }} />
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 8px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => changeSection('menu')}
            style={{
              border: 0,
              background: 'transparent',
              padding: 6,
              display: 'inline-flex',
              cursor: 'pointer',
              color: 'var(--fg-primary)',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <h2 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em' }}>
            {activeSection?.label}
          </h2>
        </div>
        <div style={{ padding: 16, flex: 1 }}>{renderBody(true)}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 0', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>설정</h1>
          <div className="sub">카테고리·계좌·알림 등</div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 24,
          padding: '20px 28px',
          maxWidth: 1320,
          alignItems: 'start',
        }}
      >
        <aside
          style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 8,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
          }}
        >
          {SECTIONS.map(s => {
            const IconComp = s.icon
            const active = section === s.id
            return (
              <button
                key={s.id}
                onClick={() => changeSection(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  border: 0,
                  background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                  color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <IconComp size={16} strokeWidth={1.9} />
                <span>{s.label}</span>
              </button>
            )
          })}
        </aside>
        <div style={{ minWidth: 0 }}>{renderBody(false)}</div>
      </div>
    </div>
  )
}

function PlaceholderSection({ section }: { section: SectionDef }) {
  const IconComp = section.icon
  return (
    <div
      className="p-card"
      style={{
        padding: 40,
        textAlign: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'var(--bg-brand-subtle)',
          color: 'var(--fg-brand-strong)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <IconComp size={22} strokeWidth={1.9} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{section.label}</div>
      <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>{section.desc}</div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-tertiary)',
          marginTop: 14,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        다음 단계에서 구현
      </div>
    </div>
  )
}
