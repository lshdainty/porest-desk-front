import type { CSSProperties, ReactNode } from 'react'
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
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

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
  title: string
  description: string
}[] = [
  {
    field: 'notifyPayment',
    icon: <CreditCard size={18} strokeWidth={1.9} />,
    tone: 'expense',
    title: '결제 알림',
    description: '결제 예정일 D-1, 결제일 당일 알림',
  },
  {
    field: 'notifyBudget',
    icon: <Target size={18} strokeWidth={1.9} />,
    tone: 'warning',
    title: '예산 알림',
    description: '카테고리 예산 50%·80%·100% 도달',
  },
  {
    field: 'notifyAutoRecord',
    icon: <Zap size={18} strokeWidth={1.9} />,
    tone: 'info',
    title: '자동 기록 알림',
    description: '반복 거래가 자동으로 기록되었을 때',
  },
  {
    field: 'notifyDutchPay',
    icon: <Users size={18} strokeWidth={1.9} />,
    tone: 'brand',
    title: '더치페이 알림',
    description: '송금 요청 / 정산 완료 알림',
  },
  {
    field: 'notifyCalendar',
    icon: <CalendarClock size={18} strokeWidth={1.9} />,
    tone: 'success',
    title: '일정 알림',
    description: '캘린더 이벤트 시작 15분 전',
  },
  {
    field: 'notifyWeeklyReport',
    icon: <BarChart3 size={18} strokeWidth={1.9} />,
    tone: 'info',
    title: '주간 리포트',
    description: '매주 월요일 오전 9시',
  },
  {
    field: 'notifyMonthlyReport',
    icon: <FileBarChart size={18} strokeWidth={1.9} />,
    tone: 'info',
    title: '월간 리포트',
    description: '매월 1일 오전 9시',
  },
]

const SOUND_OPTIONS: { value: NotificationSound; label: string }[] = [
  { value: 'CHIME', label: '차임' },
  { value: 'DEFAULT', label: '기본' },
  { value: 'NONE', label: '무음' },
]

const EMAIL_FREQ_OPTIONS: { value: EmailFrequency; label: string }[] = [
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
]

export function NotificationsManager({ mobile }: { mobile: boolean }) {
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
      // 앱 카드 간 간격(PSpace.x20) 정합 — ManagerShell(gap 16) 대신 gap 20.
      // 앱 _Content 하단 SizedBox(x32) 정합 — 최하단 여백 32.
      <div className="flex flex-col" style={{ gap: 20, paddingBottom: 32 }}>
        {!mobile && (
          <ManagerHead
            title="알림 설정"
            description="결제·예산·일정 등 어떤 알림을 어떻게 받을지 설정합니다."
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
    // 앱 카드 간 간격(PSpace.x20) 정합 — ManagerShell(gap 16) 대신 gap 20.
    // 앱 _Content 하단 SizedBox(x32) 정합 — 최하단 여백 32.
    <div className="flex flex-col" style={{ gap: 20, paddingBottom: 32 }}>
      {!mobile && (
        <ManagerHead
          title="알림 설정"
          description="결제·예산·일정 등 어떤 알림을 어떻게 받을지 설정합니다."
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
            title="푸시 알림"
            // 앱 _MasterCard 제목은 카드 제목 톤(bodyLg 16/700/lh1.6).
            titleStyle={{
              fontSize: 'var(--text-body-lg)',
              fontWeight: 700,
              lineHeight: '1.6',
            }}
            description={
              pushEnabled ? '모든 알림이 활성화되어 있어요' : '알림이 꺼져 있어요'
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
      <Card>
        {/* 앱 _SectionCard 헤더(LTRB 16,16,16,8 + 제목↔서브 2) 정합.
            데스크톱에서도 패딩 16 고정(앱 정합) — md:p-xl(24) override. */}
        <CardHeader className="gap-[2px] p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[8px] md:pb-[8px]">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)', lineHeight: '1.6', fontWeight: 700 }}>알림 종류</CardTitle>
          <CardSubtitle>필요한 알림만 켜두면 더 편해요.</CardSubtitle>
        </CardHeader>
        <CardContent className="p-[var(--spacing-lg)] md:p-[var(--spacing-lg)]">
          {/* 행 사이 구분선 — 카드 가장자리까지 full-bleed (CardContent 패딩을
              음수 마진으로 뚫고 같은 만큼 안쪽 패딩 복원, 앱 정합).
              패딩이 16 고정이므로 full-bleed 인셋도 lg(16) 고정. */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {NOTIFY_ROWS.map((row, i) => (
              <div
                key={row.field}
                className="-mx-[var(--spacing-lg)] px-[var(--spacing-lg)]"
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
                  title={row.title}
                  description={
                    // 예산 알림 설명은 DB 임계값(budget_alert_threshold) 기반 — 아래 임계값 카드와 동일 값
                    row.field === 'notifyBudget'
                      ? `카테고리 예산 ${warnThreshold}%·100% 도달`
                      : row.description
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
        </CardContent>
      </Card>

      {/* 3) 예산 알림 임계값 (기존 슬라이더 카드 유지).
          데스크톱에서도 패딩 16 고정(앱 정합). */}
      <Card>
        <CardHeader className="flex-row items-center justify-between p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[2px] md:pb-[2px]">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)', lineHeight: '1.6', fontWeight: 700 }}>예산 알림 임계값</CardTitle>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            현재 <strong style={{ color: 'var(--fg-brand-strong)' }}>{warnThreshold}%</strong>
          </span>
        </CardHeader>
        <CardContent className="p-[var(--spacing-lg)] md:p-[var(--spacing-lg)]">
          <div
            style={{
              fontSize: 'var(--text-caption)',
              // 앱 임계값 설명 본문색 fgTertiary 정합.
              color: 'var(--fg-tertiary)',
              marginBottom: 8,
              lineHeight: '1.5',
            }}
          >
            예산 사용률이 이 값을 넘으면 <strong style={{ color: 'var(--status-warning-fg)' }}>경고</strong> 상태로 표시되고 알림을 받습니다.
            100%는 <strong style={{ color: 'var(--status-danger-fg)' }}>초과</strong>로 별도 알림이 발생합니다.
          </div>
          {/* 앱은 슬라이더 바로 아래 눈금 Row(gap 0) — 슬라이더 하단 여백 제거. */}
          <div>
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
        </CardContent>
      </Card>

      {/* 4) 방해 금지 시간 — 데스크톱에서도 패딩 16 고정(앱 정합). */}
      <Card>
        <CardHeader className="gap-[2px] p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[8px] md:pb-[8px]">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)', lineHeight: '1.6', fontWeight: 700 }}>방해 금지 시간</CardTitle>
          <CardSubtitle>이 시간에는 알림이 소리·진동 없이 표시됩니다.</CardSubtitle>
        </CardHeader>
        {/* 앱 _QuietHoursCard: 토글 행(symmetric h16 v12) + 펼침 블록(fromLTRB 16,0,16,12).
            extra top margin 없이 행 v-padding(12)만으로 분리. */}
        <CardContent className="p-0 md:p-0">
          <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
          <SettingRow
            icon={<Moon size={18} strokeWidth={1.9} />}
            // 앱 _Tone.info 정합 — Moon 박스 info(파랑계) 톤.
            tone="info"
            title="방해 금지 사용"
            description="시간대를 지정해 자동 무음"
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
                paddingLeft: 16,
                paddingRight: 16,
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
                  시작
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
                  종료
                </div>
                <InputTimePicker
                  value={quietHoursEnd}
                  disabled={calmDisabled}
                  onValueChange={(v) => updateMut.mutate({ quietHoursEnd: v })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5) 소리·진동 — 데스크톱에서도 패딩 16 고정(앱 정합). */}
      <Card>
        <CardHeader className="p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[8px] md:pb-[8px]">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)', lineHeight: '1.6', fontWeight: 700 }}>소리·진동</CardTitle>
        </CardHeader>
        <CardContent className="p-[var(--spacing-lg)] md:p-[var(--spacing-lg)]">
          {/* 행 사이 구분선 — 카드 가장자리까지 full-bleed (앱 정합).
              패딩 16 고정이므로 full-bleed 인셋도 lg(16) 고정. */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className="-mx-[var(--spacing-lg)] px-[var(--spacing-lg)]"
              style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}
            >
            <SettingRow
              icon={<Volume2 size={18} strokeWidth={1.9} />}
              tone="info"
              title="알림음"
              description="앱 알림 사운드"
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
                        {o.label}
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
              title="진동"
              description="모바일에서 진동 함께 알림"
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
        </CardContent>
      </Card>

      {/* 6) 이메일 알림 — 데스크톱에서도 패딩 16 고정(앱 정합). */}
      <Card>
        <CardHeader className="gap-[2px] p-[var(--spacing-lg)] md:p-[var(--spacing-lg)] pb-[8px] md:pb-[8px]">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)', lineHeight: '1.6', fontWeight: 700 }}>이메일 알림</CardTitle>
          <CardSubtitle>앱을 잘 안 열어도 이메일로 요약을 받아볼 수 있어요.</CardSubtitle>
        </CardHeader>
        {/* 앱 _EmailCard: 토글 행(symmetric h16 v12) + 펼침 블록(fromLTRB 16,0,16,12).
            extra top margin 없이 행 v-padding(12)만으로 분리. */}
        <CardContent className="p-0 md:p-0">
          <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
          <SettingRow
            icon={<Mail size={18} strokeWidth={1.9} />}
            tone="info"
            title="이메일 받기"
            // 앱 빈 이메일 fallback 문구 정합.
            description={currentUser?.userEmail ?? '등록된 이메일이 없습니다'}
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
            <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 12 }}>
              {/* 앱 PSectionLabel(label) = caption 12 / fgSecondary, 아래 gap 8. */}
              <div
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--fg-secondary)',
                  marginBottom: 8,
                }}
              >
                발송 주기
              </div>
              <ToggleGroup
                type="single"
                variant="segmented"
                size="sm"
                value={emailFrequency}
                disabled={calmDisabled}
                onValueChange={(v) =>
                  v && updateMut.mutate({ emailFrequency: v as EmailFrequency })
                }
              >
                {EMAIL_FREQ_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    // 앱 PSegmented 정합: active 굵기 semi(600) + shadow 없음.
                    className="data-[state=on]:font-semibold data-[state=on]:shadow-none"
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {updateMut.isError && (
        <div
          style={{
            // 앱 에러 메시지 타이포 bodySm(13) 정합.
            fontSize: 'var(--text-body-sm)',
            color: 'var(--fg-expense)',
          }}
        >
          저장에 실패했어요. 잠시 뒤 다시 시도해주세요.
        </div>
      )}
    </div>
  )
}
