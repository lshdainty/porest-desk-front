import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  CalendarDays,
  Calendar1,
  ChevronLeft,
  ChevronRight,
  Download,
  Fingerprint,
  Key,
  LogOut,
  Monitor,
  Palette,
  Repeat,
  Tag,
  Target,
  Trash2,
  User,
  CreditCard,
  FilePen,
} from 'lucide-react'
import {
  AccountManager,
  AppearanceSection,
  BudgetManager,
  CalendarLabelsSection,
  CalendarShareSection,
  CategoryManager,
  NotificationsManager,
  PresetManager,
  RecurringManager,
} from '@/features/porest/dialogs'
import { Card, CardContent } from '@/shared/ui/card'
import { useTheme } from '@/shared/ui/theme-provider'
import { useCurrentUser } from '@/features/user'
import { useAuth } from '@/features/auth'
import { Switch } from '@/shared/ui/switch'
import { Button } from '@/shared/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { PasswordChangeDialog } from '@/widgets/sidebar/ui/PasswordChangeDialog'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'

type OutletCtx = { onAddTx: () => void; mobile: boolean }
type SectionId =
  | 'categories'
  | 'accounts'
  | 'budget'
  | 'recurring'
  | 'presets'
  | 'calendar-share'
  | 'calendar-labels'
  | 'appearance'
  | 'notifications'
  | 'data'
  | 'account'

interface SectionDef {
  id: SectionId
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  desc: string
}

const SECTIONS: SectionDef[] = [
  { id: 'categories', label: '카테고리 관리', icon: Tag, desc: '지출·수입 카테고리 추가·수정·삭제' },
  { id: 'accounts', label: '계좌·카드 관리', icon: CreditCard, desc: '연결된 계좌와 카드 관리' },
  { id: 'budget', label: '예산 설정', icon: FilePen, desc: '월간 예산 및 카테고리별 한도' },
  { id: 'recurring', label: '반복 거래 관리', icon: Repeat, desc: '구독·고정 결제·정기 수입 일괄 관리' },
  { id: 'presets', label: '프리셋 관리', icon: Bookmark, desc: '자주 쓰는 내역을 한 번 탭으로 채우기' },
  { id: 'calendar-share', label: '캘린더 관리·공유', icon: Calendar1, desc: '다중 캘린더 생성과 멤버 공유 설정' },
  { id: 'calendar-labels', label: '캘린더 라벨', icon: Tag, desc: '전 캘린더 공용 라벨 관리' },
  { id: 'appearance', label: '표시 설정', icon: Palette, desc: '테마·밀도·기본 통화' },
  { id: 'notifications', label: '알림', icon: Bell, desc: '결제 예정·예산 초과 알림' },
  { id: 'data', label: '데이터 내보내기', icon: Download, desc: 'CSV·PDF로 거래 내역 백업' },
  { id: 'account', label: '계정', icon: User, desc: '프로필·보안·로그아웃' },
]

const SECTION_IDS: SectionId[] = SECTIONS.map(s => s.id)

// ─── 모바일 메뉴 그룹 정의 ─────────────────────────────────────
interface GroupDef {
  label: string
  sectionIds: SectionId[]
}

const MENU_GROUPS: GroupDef[] = [
  {
    label: '데이터 관리',
    sectionIds: ['categories', 'accounts', 'budget', 'recurring', 'presets'],
  },
  {
    label: '공유',
    sectionIds: ['calendar-share', 'calendar-labels'],
  },
  {
    label: '앱 환경',
    sectionIds: ['appearance', 'notifications'],
  },
  {
    label: '데이터',
    sectionIds: ['data'],
  },
  {
    label: '계정',
    sectionIds: ['account'],
  },
]

export const SettingsPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { resolvedTheme } = useTheme()
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
      case 'calendar-share':  return <CalendarShareSection mobile={m} />
      case 'calendar-labels': return <CalendarLabelsSection mobile={m} />
      case 'appearance':    return <AppearanceSection mobile={m} />
      case 'notifications': return <NotificationsManager mobile={m} />
      case 'account':       return <AccountSection />
      default:              return <PlaceholderSection section={activeSection} />
    }
  }

  if (mobile) {
    if (section === 'menu') {
      return <MobileMenuView changeSection={changeSection} />
    }

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100,
        background: 'var(--bg-canvas)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '12px 8px',
            background: 'var(--bg-surface)',
            flexShrink: 0,
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
              borderRadius: 'var(--radius-md)',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <h2 style={{ flex: 1, margin: 0, fontSize: 'var(--text-title-md)', fontWeight: '600', letterSpacing: '-0.012em' }}>
            {activeSection?.label}
          </h2>
        </div>
        {/* 모바일 섹션 본문 스크롤 — scrollbar 숨김(스크롤 기능 유지). 데스크톱/태블릿은 별도 분기라 무관. */}
        {/* 앱 설정 계열 화면(ListView x20/x24) 정합 — 상하 24 / 좌우 20 */}
        <div className="scrollbar-hide" style={{ padding: '24px 20px', flex: 1, overflowY: 'auto', minHeight: 0 }}>{renderBody(true)}</div>
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
            boxShadow: 'var(--shadow-sm)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {SECTIONS.map(s => {
            const IconComp = s.icon
            const active = section === s.id
            // inactive 는 회색(fg-secondary) 그대로 유지. 선택 탭만 다크에서 brand light variant 로.
            // DESIGN.desk.md: 어두운 표면 위 브랜드 텍스트·아이콘 = primary-light(#5fa0e5) — spec 정합.
            const dark = resolvedTheme === 'dark'
            const navColor = active
              ? dark ? 'var(--color-primary-light)' : 'var(--fg-brand-strong)'
              : 'var(--fg-secondary)'
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
                  // 설정 nav 한정: 다크에선 배경 틴트도 primary-light(#5fa0e5) 15% mix — 텍스트와 같은 light 톤.
                  // (라이트는 글로벌 bg-brand-subtle = primary 8% 유지.)
                  background: active
                    ? dark
                      ? 'color-mix(in srgb, var(--color-primary-light) 15%, transparent)'
                      : 'var(--bg-brand-subtle)'
                    : 'transparent',
                  color: navColor,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-label-sm)',
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

// ─── 모바일 메뉴 뷰 ────────────────────────────────────────────
function MobileMenuView({ changeSection }: { changeSection: (id: SectionId | 'menu') => void }) {
  const { data: user } = useCurrentUser()

  return (
    <>
      {/* 풀스크린 페이지 — 앱처럼 ← 설정 헤더, 뒤로가면 '전체' */}
      <MobileBackHeader title="설정" />
      <div className="px-5 pb-8" style={{ paddingTop: 20 }}>
      {/* 프로필 카드 */}
      <button
        onClick={() => changeSection('account')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: 16,
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
          borderRadius: 'var(--radius-card)',
          border: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.userName ? user.userName.charAt(0) : '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>
            {user?.userName ?? '사용자'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            내 정보 · 보안 · 연결된 계정
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
      </button>

      {/* 그룹 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {MENU_GROUPS.map(group => {
          const groupSections = group.sectionIds
            .map(id => SECTIONS.find(s => s.id === id))
            .filter((s): s is SectionDef => s !== undefined)

          return (
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
                {groupSections.map((s, idx) => {
                  const IconComp = s.icon
                  const isLast = idx === groupSections.length - 1
                  return (
                    <button
                      key={s.id}
                      onClick={() => changeSection(s.id)}
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
                      {/* 아이콘 네모 배경 제거 — 아이콘만 (앱 동일 처리) */}
                      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                        <IconComp size={16} strokeWidth={1.8} color="var(--fg-secondary)" />
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
                        {s.label}
                      </span>
                      <ChevronRight size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </>
  )
}

// ─── Account Section ───────────────────────────────────────────
function AccountSection() {
  const { data: user } = useCurrentUser()
  const { logout } = useAuth()
  const [pwDialogOpen, setPwDialogOpen] = useState(false)

  const nameInitial = user?.userName ? user.userName.charAt(0) : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 프로필 헤더 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
          borderRadius: 'var(--radius-card)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {nameInitial}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
          {user?.userName ?? '사용자'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>
          {user?.userEmail ?? ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Button variant="ghost" size="sm">
            ✎ 편집
          </Button>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-brand-subtle)',
              color: 'var(--fg-brand-strong)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            Pro
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>
          가입 2024년 11월
        </div>
      </div>

      {/* 보안 */}
      <AccountGroup label="보안">
        <AccountRow
          icon={<Key size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="비밀번호 변경"
          desc="최근 변경 없음"
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          onClick={() => setPwDialogOpen(true)}
        />
        <AccountRow
          icon={<Monitor size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="2단계 인증"
          desc="사용 안 함"
          right={<Switch checked={false} onCheckedChange={() => {}} />}
        />
        <AccountRow
          icon={<Fingerprint size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="생체 인증"
          desc="앱에서 설정 가능"
          dimmed
        />
        <AccountRow
          icon={<Monitor size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="로그인된 기기"
          desc="현재 기기"
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
        />
        <AccountRow
          icon={<CalendarDays size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="로그인 기록"
          desc="최근 30일"
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          isLast
        />
      </AccountGroup>

      {/* 연결된 계정 */}
      <AccountGroup label="연결된 계정">
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>G</span>}
          label="Google"
          desc="연결 안 됨"
          right={<Button variant="outline" size="sm" style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>연결</Button>}
        />
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>A</span>}
          label="Apple ID"
          desc="연결 안 됨"
          right={<Button variant="outline" size="sm" style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>연결</Button>}
        />
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>K</span>}
          label="카카오"
          desc="연결 안 됨"
          right={<Button variant="outline" size="sm" style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>연결</Button>}
        />
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>N</span>}
          label="네이버"
          desc="연결 안 됨"
          right={<Button variant="outline" size="sm" style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>연결</Button>}
          isLast
        />
      </AccountGroup>

      {/* 구독·결제 */}
      <AccountGroup label="구독·결제">
        <AccountRow
          icon={<Bookmark size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="Porest Free"
          desc="무료 플랜 사용 중"
        />
        <AccountRow
          icon={<Target size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="플랜 업그레이드"
          desc="Pro 9,900원/월"
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          isLast
        />
      </AccountGroup>

      {/* 계정 관리 */}
      <AccountGroup label="계정 관리">
        <AccountRow
          icon={<LogOut size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label="로그아웃"
          desc="이 기기에서만"
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          onClick={logout}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <AccountRow
              icon={<Trash2 size={20} style={{ color: 'var(--status-danger)' }} />}
              label="회원 탈퇴"
              desc="영구 삭제"
              labelColor="var(--status-danger)"
              isLast
              asChild
            />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                회원 탈퇴 시 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                탈퇴하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AccountGroup>

      {/* 비밀번호 변경 다이얼로그 */}
      <PasswordChangeDialog open={pwDialogOpen} onOpenChange={setPwDialogOpen} />
    </div>
  )
}

// ─── AccountGroup ──────────────────────────────────────────────
function AccountGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--fg-primary)',
          paddingBottom: 8,
          paddingLeft: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── AccountRow ────────────────────────────────────────────────
interface AccountRowProps {
  icon: React.ReactNode
  label: string
  desc?: string
  right?: React.ReactNode
  isLast?: boolean
  onClick?: () => void
  dimmed?: boolean
  labelColor?: string
  asChild?: boolean
}

function AccountRow({
  icon,
  label,
  desc,
  right,
  isLast,
  onClick,
  dimmed,
  labelColor,
  asChild,
}: AccountRowProps) {
  const content = (
    <>
      <span
        style={{
          width: 24,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 600,
          color: labelColor ?? 'var(--fg-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>
      {desc && (
        <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginRight: right ? 8 : 0 }}>
          {desc}
        </span>
      )}
      {right}
    </>
  )

  const sharedStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '14px 16px',
    borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
  }

  if (asChild) {
    return (
      <button
        style={{
          ...sharedStyle,
          border: 0,
          borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        {content}
      </button>
    )
  }

  if (onClick && !dimmed) {
    return (
      <button
        onClick={onClick}
        style={{
          ...sharedStyle,
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
        {content}
      </button>
    )
  }

  return (
    <div
      style={{
        ...sharedStyle,
        cursor: dimmed ? 'default' : 'default',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      {content}
    </div>
  )
}

// ─── PlaceholderSection ────────────────────────────────────────
function PlaceholderSection({ section }: { section: SectionDef }) {
  const IconComp = section.icon
  return (
    <Card
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <CardContent style={{ padding: 40, paddingTop: 40, textAlign: 'center' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-lg)',
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
      <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', marginBottom: 4 }}>{section.label}</div>
      <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)' }}>{section.desc}</div>
      <div
        style={{
          fontSize: 'var(--text-badge)',
          color: 'var(--fg-tertiary)',
          marginTop: 14,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        다음 단계에서 구현
      </div>
      </CardContent>
    </Card>
  )
}
