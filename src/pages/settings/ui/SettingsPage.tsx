import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isEn } from '@/shared/lib/porest/format'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  CalendarDays,
  CalendarCog,
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
  Trash2,
  User,
  CreditCard,
  FilePen,
  Sparkles,
} from 'lucide-react'
import {
  AccountManager,
  AppearanceSection,
  BudgetManager,
  CalendarLabelsSection,
  CalendarShareSection,
  CategoryManager,
  DataExportSection,
  NotificationsManager,
  PresetManager,
  RecurringManager,
} from '@/features/porest/dialogs'
import { Card, CardContent } from '@/shared/ui/card'
import { useTheme } from '@/shared/ui/theme-provider'
import { useCurrentUser } from '@/features/user'
import { useAuth } from '@/features/auth'
import { SubscriptionDialog } from '@/features/subscription/ui/SubscriptionDialog'
import { TossConnectCard } from '@/features/subscription/ui/TossConnectCard'
import { useMyFeatures, useMySubscription } from '@/features/subscription/model/useSubscription'
import { oauthLinkApi, useOAuthProviders, useUnlinkOAuth } from '@/features/oauth-link'
import { oauthKeys } from '@/shared/config'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Switch } from '@/shared/ui/switch'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
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
  labelKey: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  descKey: string
}

const SECTIONS: SectionDef[] = [
  { id: 'categories', labelKey: 'sections.categories.label', icon: Tag, descKey: 'sections.categories.desc' },
  { id: 'accounts', labelKey: 'sections.accounts.label', icon: CreditCard, descKey: 'sections.accounts.desc' },
  { id: 'budget', labelKey: 'sections.budget.label', icon: FilePen, descKey: 'sections.budget.desc' },
  { id: 'recurring', labelKey: 'sections.recurring.label', icon: Repeat, descKey: 'sections.recurring.desc' },
  { id: 'presets', labelKey: 'sections.presets.label', icon: Bookmark, descKey: 'sections.presets.desc' },
  { id: 'calendar-share', labelKey: 'sections.calendarShare.label', icon: CalendarCog, descKey: 'sections.calendarShare.desc' },
  { id: 'calendar-labels', labelKey: 'sections.calendarLabels.label', icon: Tag, descKey: 'sections.calendarLabels.desc' },
  { id: 'appearance', labelKey: 'sections.appearance.label', icon: Palette, descKey: 'sections.appearance.desc' },
  { id: 'notifications', labelKey: 'sections.notifications.label', icon: Bell, descKey: 'sections.notifications.desc' },
  { id: 'data', labelKey: 'sections.data.label', icon: Download, descKey: 'sections.data.desc' },
  { id: 'account', labelKey: 'sections.account.label', icon: User, descKey: 'sections.account.desc' },
]

const SECTION_IDS: SectionId[] = SECTIONS.map(s => s.id)

// ─── 모바일 메뉴 그룹 정의 ─────────────────────────────────────
interface GroupDef {
  labelKey: string
  sectionIds: SectionId[]
}

const MENU_GROUPS: GroupDef[] = [
  {
    labelKey: 'groups.dataManage',
    sectionIds: ['categories', 'accounts', 'budget', 'recurring', 'presets'],
  },
  {
    labelKey: 'groups.share',
    sectionIds: ['calendar-share', 'calendar-labels'],
  },
  {
    labelKey: 'groups.appEnv',
    sectionIds: ['appearance', 'notifications'],
  },
  {
    labelKey: 'groups.data',
    sectionIds: ['data'],
  },
  {
    labelKey: 'groups.account',
    sectionIds: ['account'],
  },
]

// 소셜 연동 provider → 표시 이름. 서버 미지원 provider 는 원문(소문자) 그대로 노출.
const OAUTH_PROVIDER_LABELS: Record<string, string> = { google: 'Google' }

export const SettingsPage = () => {
  const { t } = useTranslation('settings')
  const { t: tCat } = useTranslation('category')
  const { mobile } = useOutletContext<OutletCtx>()
  // 카테고리 순서 편집 모드 — 디자인 m-subhead 우측 '편집/완료' 토글(모바일 전용).
  const [catReorder, setCatReorder] = useState(false)
  const { resolvedTheme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

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

  // 소셜 연동 복귀 처리 — SSO→Google 연동 후 ?linked=<provider>(성공) / ?linkError=<msg>(실패) 를
  // 달고 이 페이지로 돌아온다. 마운트 1회: 알림 노출 + provider 상태 재조회 + 쿼리 제거.
  useEffect(() => {
    const linked = searchParams.get('linked')
    const linkError = searchParams.get('linkError')
    if (!linked && !linkError) return

    if (linked) {
      const name = OAUTH_PROVIDER_LABELS[linked.toLowerCase()] ?? linked
      toast(t('account.toast.linked', { name }))
      queryClient.invalidateQueries({ queryKey: oauthKeys.all })
    } else if (linkError) {
      toast.error(linkError || t('account.toast.linkError'))
    }

    // 새로고침·뒤로가기 시 알림이 재노출되지 않도록 쿼리스트링 제거 (section 등 나머지는 보존).
    const url = new URL(window.location.href)
    url.searchParams.delete('linked')
    url.searchParams.delete('linkError')
    window.history.replaceState({}, '', url.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 섹션 변경 시 URL 동기화 (뒤로가기 정합성).
  const changeSection = (next: SectionId | 'menu') => {
    setSection(next)
    setCatReorder(false)
    const p = new URLSearchParams(searchParams)
    if (next === 'menu') p.delete('section')
    else p.set('section', next)
    setSearchParams(p, { replace: true })
  }

  const activeSection = section === 'menu' ? null : SECTIONS.find(s => s.id === section) ?? null

  const renderBody = (m: boolean) => {
    if (!activeSection) return null
    switch (activeSection.id) {
      case 'categories':    return <CategoryManager mobile={m} reorderMode={m && catReorder} />
      case 'accounts':      return <AccountManager mobile={m} />
      case 'budget':        return <BudgetManager mobile={m} />
      case 'recurring':     return <RecurringManager mobile={m} />
      case 'presets':       return <PresetManager mobile={m} />
      case 'calendar-share':  return <CalendarShareSection mobile={m} />
      case 'calendar-labels': return <CalendarLabelsSection mobile={m} />
      case 'appearance':    return <AppearanceSection mobile={m} />
      case 'notifications': return <NotificationsManager mobile={m} />
      case 'data':          return <DataExportSection mobile={m} />
      case 'account':       return <AccountSection mobile={m} />
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
        // 카드 다이어트 — 서브페이지도 surface 배경 위 플랫 콘텐츠 (design .m-subpage).
        background: 'var(--bg-surface)',
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
            {activeSection ? t(activeSection.labelKey) : ''}
          </h2>
          {/* 카테고리 순서 편집 토글 — 디자인 m-subhead__action-btn ('편집'↔'완료') */}
          {section === 'categories' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCatReorder(v => !v)}
              // 편집 글씨 흰색(fg-primary) — 앱 PButton ghost(fgPrimary) 정합. brand(파랑) 아님.
              style={{ color: 'var(--fg-primary)', fontWeight: 700, flexShrink: 0 }}
            >
              {catReorder ? tCat('reorderDone') : tCat('reorderEdit')}
            </Button>
          )}
        </div>
        {/* 모바일 섹션 본문 스크롤 — scrollbar 숨김(스크롤 기능 유지). 데스크톱/태블릿은 별도 분기라 무관. */}
        {/* 앱 설정 계열 화면(ListView x20/x24) 정합 — 상하 24 / 좌우 20 */}
        <div className="scrollbar-hide" style={{ padding: 'var(--spacing-xl)', flex: 1, overflowY: 'auto', minHeight: 0 }}>{renderBody(true)}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 0', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>{t('page.title')}</h1>
          <div className="sub">{t('page.subtitle')}</div>
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
                <span>{t(s.labelKey)}</span>
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
  const { t } = useTranslation('settings')
  const { data: user } = useCurrentUser()

  return (
    <>
      {/* 풀스크린 페이지 — 앱처럼 ← 설정 헤더, 뒤로가면 '전체' */}
      <MobileBackHeader title={t('page.title')} />
      <div style={{ padding: '8px 0 32px' }}>
      {/* 내 정보 — K뱅크 톤: 카드 없이 이름 헤더 행 (design MobileSettingsList) */}
      <button
        onClick={() => changeSection('account')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '14px 20px 18px',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.userName ? user.userName.charAt(0) : '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.015em' }}>
            {user?.userName ?? t('account.defaultName')}
          </div>
          <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {t('account.profileMeta')}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
      </button>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 20px 4px' }} />

      {/* 그룹 — 카드 없이 라벨 + 텍스트 행 (터치 dim), 그룹 사이 헤어라인 */}
      {MENU_GROUPS.map((group, gi) => {
        const groupSections = group.sectionIds
          .map(id => SECTIONS.find(s => s.id === id))
          .filter((s): s is SectionDef => s !== undefined)

        return (
          <div key={group.labelKey}>
            {gi > 0 && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 20px' }} />}
            <div
              style={{
                fontSize: 'var(--text-body-lg)',
                fontWeight: 700,
                color: 'var(--fg-primary)',
                letterSpacing: '-0.01em',
                padding: '14px 20px 4px',
              }}
            >
              {t(group.labelKey)}
            </div>
            <div>
              {groupSections.map(s => (
                <button
                  key={s.id}
                  onClick={() => changeSection(s.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 20px',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
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
                  <span
                    style={{
                      flex: 1,
                      fontSize: 'var(--text-body-md)',
                      fontWeight: 500,
                      color: 'var(--fg-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {t(s.labelKey)}
                  </span>
                  <ChevronRight size={15} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )
      })}
      </div>
    </>
  )
}

// ─── Account Section ───────────────────────────────────────────
function AccountSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('settings')
  const { t: tu } = useTranslation('user')
  const { t: tc } = useTranslation('common')
  const { data: user } = useCurrentUser()
  const { logout } = useAuth()
  const [pwDialogOpen, setPwDialogOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)

  const featuresQ = useMyFeatures()
  const subQ = useMySubscription()
  const isPro = featuresQ.data?.features?.includes('SECURITIES') ?? false
  const nextBill = subQ.data?.currentPeriodEnd ? subQ.data.currentPeriodEnd.slice(0, 10) : null

  const nameInitial = user?.userName ? user.userName.charAt(0) : '?'

  // 소셜 계정 연동 — Google 만 서버 지원. provider 상태로 '연결/해제' 버튼과 desc 결정.
  const providersQ = useOAuthProviders()
  const unlinkGoogle = useUnlinkOAuth()
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const google = providersQ.data?.find(p => p.type === 'GOOGLE')
  const googleLinked = google?.linked ?? false

  const onLinkGoogle = async () => {
    setLinkingGoogle(true)
    try {
      // returnUrl = 현재 설정 페이지 절대 URL. 연동 후 SSO 가 여기로 ?linked/?linkError 를 달고 복귀.
      const { startUrl } = await oauthLinkApi.startLink(
        'google',
        window.location.origin + window.location.pathname,
      )
      window.location.href = startUrl
    } catch {
      // 에러 토스트는 전역 인터셉터가 노출. 여기선 버튼 상태만 복구.
      setLinkingGoogle(false)
    }
  }

  const onUnlinkGoogle = () => {
    unlinkGoogle.mutate('google', {
      // onSuccess 에서 provider 목록 재조회(invalidate) → 상태 자동 갱신.
      onSuccess: () => toast(t('account.toast.unlinked')),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
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
          {user?.userName ?? t('account.defaultName')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>
          {user?.userEmail ?? ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Button variant="ghost" size="sm">
            ✎ {t('account.edit')}
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
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>
        {user?.joinedAt && (
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {t('account.joined', {
              date: isEn()
                ? new Date(user.joinedAt).toLocaleDateString('en', { year: 'numeric', month: 'short' })
                : `${new Date(user.joinedAt).getFullYear()}년 ${new Date(user.joinedAt).getMonth() + 1}월`,
            })}
          </div>
        )}
      </div>

      {/* 보안 */}
      <AccountGroup mobile={mobile} label={t('account.group.security')}>
        <AccountRow
          icon={<Key size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label={tu('passwordChange')}
          desc={t('account.password.desc')}
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          onClick={() => setPwDialogOpen(true)}
        />
        <AccountRow
          icon={<Monitor size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label={t('account.twoFactor.label')}
          desc={t('account.twoFactor.desc')}
          right={<Switch checked={false} onCheckedChange={() => {}} />}
        />
        <AccountRow
          icon={<Fingerprint size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label={t('account.biometric.label')}
          desc={t('account.biometric.desc')}
          dimmed
        />
        <AccountRow
          icon={<Monitor size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label={t('account.devices.label')}
          desc={t('account.devices.desc')}
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
        />
        <AccountRow
          icon={<CalendarDays size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label={t('account.loginHistory.label')}
          desc={t('account.loginHistory.desc')}
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          isLast
        />
      </AccountGroup>

      {/* 연결된 계정 */}
      <AccountGroup mobile={mobile} label={t('account.group.connected')}>
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>G</span>}
          label="Google"
          desc={googleLinked ? t('account.linked') : t('account.notLinked')}
          right={
            googleLinked ? (
              <Button
                variant="outline"
                size="sm"
                style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
                onClick={onUnlinkGoogle}
                loading={unlinkGoogle.isPending}
                disabled={providersQ.isLoading}
              >
                {t('account.unlink')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
                onClick={onLinkGoogle}
                loading={linkingGoogle}
                disabled={providersQ.isLoading}
              >
                {t('account.link')}
              </Button>
            )
          }
        />
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>A</span>}
          label="Apple ID"
          desc={t('account.notLinked')}
          right={<Button variant="outline" size="sm" disabled style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>{t('account.link')}</Button>}
        />
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>K</span>}
          label={t('account.provider.kakao')}
          desc={t('account.notLinked')}
          right={<Button variant="outline" size="sm" disabled style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>{t('account.link')}</Button>}
        />
        <AccountRow
          icon={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-secondary)' }}>N</span>}
          label={t('account.provider.naver')}
          desc={t('account.notLinked')}
          right={<Button variant="outline" size="sm" disabled style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}>{t('account.link')}</Button>}
          isLast
        />
      </AccountGroup>

      {/* 구독·결제 — 앱 account_screen 정합: 40 브랜드 칩 + 제목/부제 스택 + 가격/배지 + chevron */}
      <AccountGroup mobile={mobile} label={t('account.group.subscription')}>
        <SubscriptionRow isPro={isPro} nextBill={nextBill} onClick={() => setSubOpen(true)} />
      </AccountGroup>

      {/* 증권 데이터 연동 — 구독(Pro) 시에만 */}
      {isPro && <TossConnectCard />}

      {/* 계정 관리 */}
      <AccountGroup mobile={mobile} label={t('account.group.manage')}>
        <AccountRow
          icon={<LogOut size={20} style={{ color: 'var(--fg-secondary)' }} />}
          label={t('account.logout.label')}
          desc={t('account.logout.desc')}
          right={<ChevronRight size={16} style={{ color: 'var(--fg-tertiary)' }} />}
          onClick={logout}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <AccountRow
              icon={<Trash2 size={20} style={{ color: 'var(--status-danger)' }} />}
              label={t('account.withdraw.label')}
              desc={t('account.withdraw.desc')}
              labelColor="var(--status-danger)"
              isLast
              asChild
            />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('account.withdrawConfirm.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('account.withdrawConfirm.desc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('account.withdrawConfirm.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AccountGroup>

      {/* 비밀번호 변경 다이얼로그 */}
      <PasswordChangeDialog open={pwDialogOpen} onOpenChange={setPwDialogOpen} />

      {/* 구독 관리 다이얼로그 */}
      {subOpen && <SubscriptionDialog onClose={() => setSubOpen(false)} mobile={mobile} />}
    </div>
  )
}

// ─── AccountGroup ──────────────────────────────────────────────
function AccountGroup({ label, children, mobile }: { label: string; children: React.ReactNode; mobile?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--fg-primary)',
          paddingBottom: 8,
        }}
      >
        {label}
      </div>
      {/* 모바일 카드 다이어트(사용자 결정) — 셸 없이 플랫 리스트. 데스크톱은 카드 유지. */}
      <div
        style={mobile ? undefined : {
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
    padding: '14px 0', // 좌우 inset 삭제(사용자 결정)
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

// ─── SubscriptionRow (구독·결제) ───────────────────────────────
// 앱 account_screen 구독 행 정합 — generic AccountRow(가로 desc)는 긴 부제에서
// 제목이 글자단위로 깨져, 40 브랜드 칩 + 제목/부제 세로 스택 + 우측 가격/배지로 분리.
function SubscriptionRow({
  isPro,
  nextBill,
  onClick,
}: {
  isPro: boolean
  nextBill: string | null
  onClick: () => void
}) {
  const { t } = useTranslation('settings')
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '14px 0', // 좌우 inset 삭제(사용자 결정)
        border: 0,
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
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-brand-subtle)',
          color: 'var(--fg-brand)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Sparkles size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 700,
            color: 'var(--fg-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Porest Pro
        </div>
        <div
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--fg-tertiary)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isPro
            ? nextBill
              ? t('account.sub.proActiveBill', { date: nextBill })
              : t('account.sub.proActive')
            : t('account.sub.proPromo')}
        </div>
      </div>
      {isPro ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
          <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
            9,900원
          </div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{t('account.sub.perMonth')}</div>
        </div>
      ) : (
        <Badge variant="default">{t('account.sub.proStart')}</Badge>
      )}
      <ChevronRight size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
    </button>
  )
}

// ─── PlaceholderSection ────────────────────────────────────────
function PlaceholderSection({ section }: { section: SectionDef }) {
  const { t } = useTranslation('settings')
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
      <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', marginBottom: 4 }}>{t(section.labelKey)}</div>
      <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)' }}>{t(section.descKey)}</div>
      <div
        style={{
          fontSize: 'var(--text-badge)',
          color: 'var(--fg-tertiary)',
          marginTop: 14,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {t('account.comingSoon')}
      </div>
      </CardContent>
    </Card>
  )
}
