import type { CSSProperties, ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  BarChart3,
  Bell,
  CalendarClock,
  CreditCard,
  FileBarChart,
  Mail,
  Moon,
  Target,
  Users,
  Vibrate,
  Volume2,
  Zap,
} from 'lucide-react'
import {
  useCurrentUser,
  useUpdateUserPreferences,
  useUserPreferences,
  type EmailFrequency,
  type NotificationSound,
} from '@/features/user'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { InputTimePicker } from '@/shared/ui/input-time-picker'
import { ManagerHead } from '@/shared/ui/porest/manager-layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'
import { Switch } from '@/shared/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type Tone = 'expense' | 'warning' | 'info' | 'brand' | 'success'

const TONE_STYLE: Record<Tone, { bg: string; fg: string }> = {
  expense: { bg: 'var(--status-danger-subtle)', fg: 'var(--status-danger-fg)' },
  warning: { bg: 'var(--status-warning-subtle)', fg: 'var(--status-warning-fg)' },
  info: { bg: 'var(--status-info-subtle)', fg: 'var(--status-info-fg)' },
  // brand-subtle 은 다크에서 surface 와 거의 같아 박스가 묻힘 —
  // fg-brand(다크=primary-light 자동 swap) 15% 틴트로 양 모드 가시성 확보.
  brand: {
    bg: 'color-mix(in srgb, var(--fg-brand) 15%, transparent)',
    fg: 'var(--fg-brand)',
  },
  success: { bg: 'var(--status-success-subtle)', fg: 'var(--status-success-fg)' },
}

/** 한 행의 [tone 아이콘박스] 제목 + 회색 설명 + 우측 컨트롤 레이아웃. */
function SettingRow({
  icon,
  tone,
  title,
  titleStyle,
  description,
  descriptionColor = 'var(--fg-tertiary)',
  control,
  disabled,
}: {
  icon: ReactNode
  tone: Tone
  title: string
  /** 제목 타이포 override — 마스터 카드는 카드 제목 톤(16/700) 사용. */
  titleStyle?: CSSProperties
  description: ReactNode
  /** 설명 색 override — 마스터 카드 설명은 앱 정합으로 fg-secondary. */
  descriptionColor?: string
  control: ReactNode
  disabled?: boolean
}) {
  const t = TONE_STYLE[tone]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        // 앱 정합: off(disabled) 처리는 행 전체 opacity 가 아닌
        // 아이콘 박스 opacity 0.4 + 텍스트색 fg-disabled 교체로 표현.
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: t.bg,
          color: t.fg,
          opacity: disabled ? 0.4 : 1,
          transition: 'opacity var(--motion-duration-fast) var(--motion-ease-out)',
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            // 앱 행 제목(bodySm 13/semi) 정합 — body-md(15) → label-sm(13).
            fontSize: 'var(--text-label-sm)',
            fontWeight: '600',
            color: disabled ? 'var(--fg-disabled)' : 'var(--fg-primary)',
            lineHeight: '1.5',
            ...titleStyle,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 'var(--text-caption)',
            color: disabled ? 'var(--fg-disabled)' : descriptionColor,
            // 앱 caption h1.5 정합
            lineHeight: '1.5',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

function CardSubtitle({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 'var(--text-caption)',
        color: 'var(--fg-tertiary)',
        margin: 0,
        lineHeight: '1.5',
      }}
    >
      {children}
    </p>
  )
}

const NOTIFY_ROWS: {
  field:
    | 'notifyPayment'
    | 'notifyBudget'
    | 'notifyAutoRecord'
    | 'notifyDutchPay'
    | 'notifyCalendar'
    | 'notifyWeeklyReport'
    | 'notifyMonthlyReport'
  icon: ReactNode
  tone: Tone
  titleKey: string
  descKey: string
}[] = [
  {
    field: 'notifyPayment',
    icon: <CreditCard size={18} strokeWidth={1.9} />,
    tone: 'expense',
    titleKey: 'rows.payment.title',
    descKey: 'rows.payment.desc',
  },
  {
    field: 'notifyBudget',
    icon: <Target size={18} strokeWidth={1.9} />,
    tone: 'warning',
    titleKey: 'rows.budget.title',
    descKey: 'rows.budget.desc',
  },
  {
    field: 'notifyAutoRecord',
    icon: <Zap size={18} strokeWidth={1.9} />,
    tone: 'info',
    titleKey: 'rows.autoRecord.title',
    descKey: 'rows.autoRecord.desc',
  },
  {
    field: 'notifyDutchPay',
    icon: <Users size={18} strokeWidth={1.9} />,
    tone: 'brand',
    titleKey: 'rows.dutchPay.title',
    descKey: 'rows.dutchPay.desc',
  },
  {
    field: 'notifyCalendar',
    icon: <CalendarClock size={18} strokeWidth={1.9} />,
    tone: 'success',
    titleKey: 'rows.calendar.title',
    descKey: 'rows.calendar.desc',
  },
  {
    field: 'notifyWeeklyReport',
    icon: <BarChart3 size={18} strokeWidth={1.9} />,
    tone: 'info',
    titleKey: 'rows.weeklyReport.title',
    descKey: 'rows.weeklyReport.desc',
  },
  {
    field: 'notifyMonthlyReport',
    icon: <FileBarChart size={18} strokeWidth={1.9} />,
    tone: 'info',
    titleKey: 'rows.monthlyReport.title',
    descKey: 'rows.monthlyReport.desc',
  },
]

const SOUND_OPTIONS: { value: NotificationSound; labelKey: string }[] = [
  { value: 'CHIME', labelKey: 'sound.options.CHIME' },
  { value: 'DEFAULT', labelKey: 'sound.options.DEFAULT' },
  { value: 'NONE', labelKey: 'sound.options.NONE' },
]

const EMAIL_FREQ_OPTIONS: { value: EmailFrequency; labelKey: string }[] = [
  { value: 'DAILY', labelKey: 'email.frequency.DAILY' },
  { value: 'WEEKLY', labelKey: 'email.frequency.WEEKLY' },
  { value: 'MONTHLY', labelKey: 'email.frequency.MONTHLY' },
]

// 모바일 카드 다이어트 — 알림 섹션 셸: 모바일은 플랫 헤드+본문(.m-subpage), 데스크톱은 기존 카드
// 마크업(패딩 16 고정 · 앱 정합)을 그대로 일반화.
function NotifSection({
  mobile,
  title,
  subtitle,
  action,
  contentPad = true,
  children,
}: {
  mobile: boolean
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  /** false 면 CardContent p-0 (내부가 자체 패딩 보유 — quiet/email 카드) */
  contentPad?: boolean
  children: React.ReactNode
}) {
  if (mobile) {
    return (
      <section>
        <div style={{ paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 'var(--text-body-lg)', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--fg-primary)' }}>
              {title}
            </h2>
            {action != null && <span style={{ marginLeft: 'auto' }}>{action}</span>}
          </div>
          {subtitle != null && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {children}
      </section>
    )
  }
  return (
    <Card>
      <CardHeader
        className={
          action != null
            ? 'flex-row items-center justify-between p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[2px] md:pb-[2px]'
            : 'gap-[2px] p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[8px] md:pb-[8px]'
        }
      >
        <CardTitle style={{ fontSize: 'var(--text-body-lg)', lineHeight: '1.6', fontWeight: 700 }}>{title}</CardTitle>
        {action}
        {subtitle != null && <CardSubtitle>{subtitle}</CardSubtitle>}
      </CardHeader>
      <CardContent className={contentPad ? 'p-[var(--spacing-lg)] md:p-[var(--spacing-lg)]' : 'p-0 md:p-0'}>
        {children}
      </CardContent>
    </Card>
  )
}

export function NotificationsManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('notification')
  const preferencesQ = useUserPreferences()
  const updateMut = useUpdateUserPreferences()
  const { data: currentUser } = useCurrentUser()

  const pref = preferencesQ.data
  const isLoading = preferencesQ.isLoading

  const pushEnabled = pref?.pushEnabled ?? true
  const warnThreshold = pref?.budgetAlertThreshold ?? 85
  const quietHoursEnabled = pref?.quietHoursEnabled ?? false
  const quietHoursStart = pref?.quietHoursStart ?? '22:00'
  const quietHoursEnd = pref?.quietHoursEnd ?? '07:00'
  const notificationSound: NotificationSound = pref?.notificationSound ?? 'DEFAULT'
  const vibrationEnabled = pref?.vibrationEnabled ?? true
  const emailEnabled = pref?.emailEnabled ?? false
  const emailFrequency: EmailFrequency = pref?.emailFrequency ?? 'WEEKLY'

  const calmDisabled = isLoading || updateMut.isPending

  if (isLoading) {
    return (
      // 설정 서브페이지 섹션 간격 spacing-2xl(32) 통일(사용자 결정).
      // 앱 _Content 하단 SizedBox(x32) 정합 — 최하단 여백 32.
      <div className="flex flex-col" style={{ gap: 'var(--spacing-2xl)', paddingBottom: 32 }}>
        {!mobile && (
          <ManagerHead
            title={t('prefs.title')}
            description={t('prefs.description')}
          />
        )}
        {/* 앱 _PrefsSkeleton 정합 — 카드별 단일 h96 블록(rounded-lg=12) 4개. */}
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBase
            key={i}
            className="w-full rounded-[var(--radius-lg)]"
            style={{ height: 96 }}
          />
        ))}
      </div>
    )
  }

  return (
    // 설정 서브페이지 섹션 간격 spacing-2xl(32) 통일(사용자 결정) — 앱 x32 정합.
    // 앱 _Content 하단 SizedBox(x32) 정합 — 최하단 여백 32.
    <div className="flex flex-col" style={{ gap: 'var(--spacing-2xl)', paddingBottom: 32 }}>
      {!mobile && (
        <ManagerHead
          title={t('prefs.title')}
          description={t('prefs.description')}
        />
      )}

      {/* 1) 푸시 알림 (마스터) — 앱 PCardVariant.brand 정합:
          bg-brand-subtle + 1px brand border + shadow 없음. */}
      <Card
        variant="bordered"
        style={{
          background: 'var(--bg-brand-subtle)',
          borderColor: 'var(--border-brand)',
        }}
      >
        {/* 앱 _MasterCard 패딩 EdgeInsets.all(lg=16) 고정 — 데스크톱에서도 24 아님. */}
        <CardContent className="p-[var(--spacing-lg)] md:p-[var(--spacing-lg)]">
          <SettingRow
            icon={<Bell size={18} strokeWidth={1.9} />}
            tone="brand"
            title={t('push.title')}
            // 앱 _MasterCard 제목은 카드 제목 톤(bodyLg 16/700/lh1.6).
            titleStyle={{
              fontSize: 'var(--text-body-lg)',
              fontWeight: 700,
              lineHeight: '1.6',
            }}
            description={
              pushEnabled ? t('push.on') : t('push.off')
            }
            // 앱 _MasterCard 설명색 fgSecondary.
            descriptionColor="var(--fg-secondary)"
            control={
              <Switch
                checked={pushEnabled}
                disabled={calmDisabled}
                onCheckedChange={(v) => updateMut.mutate({ pushEnabled: v })}
              />
            }
          />
        </CardContent>
      </Card>

      {/* 2) 알림 종류 */}
      {/* 앱 _SectionCard 헤더(LTRB 16,16,16,8 + 제목↔서브 2) 정합. 모바일 카드 다이어트 — 셸 벗김. */}
      <NotifSection mobile={mobile} title={t('types.title')} subtitle={t('types.subtitle')}>
          {/* 행 사이 구분선 — 카드 가장자리까지 full-bleed (CardContent 패딩을
              음수 마진으로 뚫고 같은 만큼 안쪽 패딩 복원, 앱 정합).
              패딩이 16 고정이므로 full-bleed 인셋도 lg(16) 고정. */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {NOTIFY_ROWS.map((row, i) => (
              <div
                key={row.field}
                className={mobile ? undefined : '-mx-[var(--spacing-lg)] px-[var(--spacing-lg)]'}
                style={{
                  paddingTop: 12,
                  paddingBottom: i === NOTIFY_ROWS.length - 1 ? 0 : 12,
                  borderBottom:
                    i === NOTIFY_ROWS.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                <SettingRow
                  icon={row.icon}
                  tone={row.tone}
                  title={t(row.titleKey)}
                  description={
                    // 예산 알림 설명은 DB 임계값(budget_alert_threshold) 기반 — 아래 임계값 카드와 동일 값
                    row.field === 'notifyBudget'
                      ? t('rows.budget.desc', { threshold: warnThreshold })
                      : t(row.descKey)
                  }
                  disabled={!pushEnabled}
                  control={
                    <Switch
                      checked={pref?.[row.field] ?? true}
                      disabled={!pushEnabled || calmDisabled}
                      onCheckedChange={(v) => updateMut.mutate({ [row.field]: v })}
                    />
                  }
                />
              </div>
            ))}
          </div>
      </NotifSection>

      {/* 3) 예산 알림 임계값 — 모바일 카드 다이어트: 셸 벗김. */}
      <NotifSection
        mobile={mobile}
        title={t('threshold.title')}
        action={
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            {t('threshold.current')} <strong style={{ color: 'var(--fg-brand-strong)' }}>{warnThreshold}%</strong>
          </span>
        }
      >
          <div
            style={{
              fontSize: 'var(--text-caption)',
              // 앱 임계값 설명 본문색 fgTertiary 정합.
              color: 'var(--fg-tertiary)',
              marginBottom: 8,
              lineHeight: '1.5',
            }}
          >
            <Trans
              t={t}
              i18nKey="threshold.desc"
              components={{
                warn: <strong style={{ color: 'var(--status-warning-fg)' }} />,
                over: <strong style={{ color: 'var(--status-danger-fg)' }} />,
              }}
            />
          </div>
          {/* 앱 Flutter Slider 는 위젯 높이 44 — 트랙 위아래 ~20px 내재 여백.
              웹 슬라이더(16px)에 동일한 실효 간격을 padding 으로 재현. */}
          <div style={{ padding: '20px 0' }}>
            <Slider
              min={50}
              max={100}
              step={5}
              // 5단위 눈금 점 — 앱 divisions(10) 틱 마커 정합 (10구간 + 1 = 11).
              ticks={11}
              value={[warnThreshold]}
              onValueChange={([v]) => updateMut.mutate({ budgetAlertThreshold: v })}
              disabled={calmDisabled}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              // 앱 눈금 라벨 PTypo.micro(11/500/lh1.5/ls0.44) 정합.
              fontSize: 'var(--text-badge)',
              fontWeight: 500,
              lineHeight: '1.5',
              letterSpacing: '0.44px',
              color: 'var(--fg-tertiary)',
            }}
          >
            <span>50</span>
            <span>60</span>
            <span>70</span>
            <span>80</span>
            <span>90</span>
            <span>100</span>
          </div>
      </NotifSection>

      {/* 4) 방해 금지 시간 — 모바일 카드 다이어트: 셸 벗김(내부 16 패딩은 카드 기준이라 모바일 0). */}
      <NotifSection mobile={mobile} title={t('quiet.title')} subtitle={t('quiet.subtitle')} contentPad={false}>
          <div style={{ paddingLeft: mobile ? 0 : 16, paddingRight: mobile ? 0 : 16, paddingTop: 12, paddingBottom: 12 }}>
          <SettingRow
            icon={<Moon size={18} strokeWidth={1.9} />}
            // 앱 _Tone.info 정합 — Moon 박스 info(파랑계) 톤.
            tone="info"
            title={t('quiet.use.title')}
            description={t('quiet.use.desc')}
            control={
              <Switch
                checked={quietHoursEnabled}
                disabled={calmDisabled}
                onCheckedChange={(v) => updateMut.mutate({ quietHoursEnabled: v })}
              />
            }
          />
          </div>
          {quietHoursEnabled && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                paddingLeft: mobile ? 0 : 16,
                paddingRight: mobile ? 0 : 16,
                paddingBottom: 12,
              }}
            >
              <div>
                {/* 앱 PSectionLabel(label) = caption 12 / fgSecondary, 아래 gap 4. */}
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-secondary)',
                    marginBottom: 4,
                  }}
                >
                  {t('quiet.start')}
                </div>
                <InputTimePicker
                  value={quietHoursStart}
                  disabled={calmDisabled}
                  onValueChange={(v) => updateMut.mutate({ quietHoursStart: v })}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-secondary)',
                    marginBottom: 4,
                  }}
                >
                  {t('quiet.end')}
                </div>
                <InputTimePicker
                  value={quietHoursEnd}
                  disabled={calmDisabled}
                  onValueChange={(v) => updateMut.mutate({ quietHoursEnd: v })}
                />
              </div>
            </div>
          )}
      </NotifSection>

      {/* 5) 소리·진동 — 모바일 카드 다이어트: 셸 벗김. */}
      <NotifSection mobile={mobile} title={t('sound.title')}>
          {/* 행 사이 구분선 — 카드 가장자리까지 full-bleed (앱 정합).
              패딩 16 고정이므로 full-bleed 인셋도 lg(16) 고정. */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className={mobile ? undefined : '-mx-[var(--spacing-lg)] px-[var(--spacing-lg)]'}
              style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}
            >
            <SettingRow
              icon={<Volume2 size={18} strokeWidth={1.9} />}
              tone="info"
              title={t('sound.notif.title')}
              description={t('sound.notif.desc')}
              control={
                <Select
                  value={notificationSound}
                  disabled={calmDisabled}
                  onValueChange={(v) =>
                    updateMut.mutate({ notificationSound: v as NotificationSound })
                  }
                >
                  {/* 앱 PSelect 정합: 폭 120 / 값 폰트 bodyLg(16) / chevron fgSecondary. */}
                  <SelectTrigger className="w-[120px] text-body-lg [&>svg]:text-text-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {t(o.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            </div>
            <div style={{ paddingTop: 12 }}>
            <SettingRow
              icon={<Vibrate size={18} strokeWidth={1.9} />}
              tone="brand"
              title={t('sound.vibration.title')}
              description={t('sound.vibration.desc')}
              control={
                <Switch
                  checked={vibrationEnabled}
                  disabled={calmDisabled}
                  onCheckedChange={(v) => updateMut.mutate({ vibrationEnabled: v })}
                />
              }
            />
            </div>
          </div>
      </NotifSection>

      {/* 6) 이메일 알림 — 모바일 카드 다이어트: 셸 벗김(내부 16 패딩은 카드 기준이라 모바일 0). */}
      <NotifSection mobile={mobile} title={t('email.title')} subtitle={t('email.subtitle')} contentPad={false}>
          <div style={{ paddingLeft: mobile ? 0 : 16, paddingRight: mobile ? 0 : 16, paddingTop: 12, paddingBottom: 12 }}>
          <SettingRow
            icon={<Mail size={18} strokeWidth={1.9} />}
            tone="info"
            title={t('email.receive.title')}
            // 앱 빈 이메일 fallback 문구 정합.
            description={currentUser?.userEmail ?? t('email.empty')}
            control={
              <Switch
                checked={emailEnabled}
                disabled={calmDisabled}
                onCheckedChange={(v) => updateMut.mutate({ emailEnabled: v })}
              />
            }
          />
          </div>
          {emailEnabled && (
            <div style={{ paddingLeft: mobile ? 0 : 16, paddingRight: mobile ? 0 : 16, paddingBottom: 12 }}>
              {/* 앱 PSectionLabel(label) = caption 12 / fgSecondary, 아래 gap 8. */}
              <div
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--fg-secondary)',
                  marginBottom: 8,
                }}
              >
                {t('email.frequency.label')}
              </div>
              <Tabs
                value={emailFrequency}
                onValueChange={(v) =>
                  v && updateMut.mutate({ emailFrequency: v as EmailFrequency })
                }
              >
                <TabsList variant="pill" size="sm" className="w-full">
                  {EMAIL_FREQ_OPTIONS.map((o) => (
                    <TabsTrigger
                      key={o.value}
                      value={o.value}
                      className="flex-1"
                      disabled={calmDisabled}
                    >
                      {t(o.labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
      </NotifSection>

      {updateMut.isError && (
        <div
          style={{
            // 앱 에러 메시지 타이포 bodySm(13) 정합.
            fontSize: 'var(--text-body-sm)',
            color: 'var(--fg-expense)',
          }}
        >
          {t('saveError')}
        </div>
      )}
    </div>
  )
}
