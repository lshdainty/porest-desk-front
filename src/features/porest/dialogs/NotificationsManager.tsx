import type { ReactNode } from 'react'
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
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
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
  brand: { bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)' },
  success: { bg: 'var(--status-success-subtle)', fg: 'var(--status-success-fg)' },
}

/** 한 행의 [tone 아이콘박스] 제목 + 회색 설명 + 우측 컨트롤 레이아웃. */
function SettingRow({
  icon,
  tone,
  title,
  description,
  control,
  disabled,
}: {
  icon: ReactNode
  tone: Tone
  title: string
  description: ReactNode
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
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity var(--motion-duration-fast) var(--motion-ease-out)',
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
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 'var(--text-body-md)',
            fontWeight: '600',
            color: 'var(--fg-primary)',
            lineHeight: '1.4',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--fg-tertiary)',
            lineHeight: '1.4',
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
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title="알림 설정"
            description="결제·예산·일정 등 어떤 알림을 어떻게 받을지 설정합니다."
          />
        )}
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <SkeletonBase className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <SkeletonBase className="h-16 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </ManagerShell>
    )
  }

  return (
    <ManagerShell>
      {!mobile && (
        <ManagerHead
          title="알림 설정"
          description="결제·예산·일정 등 어떤 알림을 어떻게 받을지 설정합니다."
        />
      )}

      {/* 1) 푸시 알림 (마스터) */}
      <Card style={{ background: 'var(--bg-brand-subtle)' }}>
        <CardContent>
          <SettingRow
            icon={<Bell size={18} strokeWidth={1.9} />}
            tone="brand"
            title="푸시 알림"
            description={
              pushEnabled ? '모든 알림이 활성화되어 있어요' : '알림이 꺼져 있어요'
            }
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
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>알림 종류</CardTitle>
          <CardSubtitle>필요한 알림만 켜두면 더 편해요.</CardSubtitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NOTIFY_ROWS.map((row) => (
              <SettingRow
                key={row.field}
                icon={row.icon}
                tone={row.tone}
                title={row.title}
                description={row.description}
                disabled={!pushEnabled}
                control={
                  <Switch
                    checked={pref?.[row.field] ?? true}
                    disabled={!pushEnabled || calmDisabled}
                    onCheckedChange={(v) => updateMut.mutate({ [row.field]: v })}
                  />
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3) 예산 알림 임계값 (기존 슬라이더 카드 유지) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>예산 알림 임계값</CardTitle>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            현재 <strong style={{ color: 'var(--fg-brand-strong)' }}>{warnThreshold}%</strong>
          </span>
        </CardHeader>
        <CardContent>
          <div
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-secondary)',
              marginBottom: 12,
              lineHeight: '1.5',
            }}
          >
            예산 사용률이 이 값을 넘으면 <strong style={{ color: 'var(--status-warning-fg)' }}>경고</strong> 상태로 표시되고 알림을 받습니다.
            100%는 <strong style={{ color: 'var(--status-danger-fg)' }}>초과</strong>로 별도 알림이 발생합니다.
          </div>
          <div style={{ marginBottom: 8 }}>
            <Slider
              min={50}
              max={100}
              step={5}
              value={[warnThreshold]}
              onValueChange={([v]) => updateMut.mutate({ budgetAlertThreshold: v })}
              disabled={calmDisabled}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--text-badge)',
              color: 'var(--fg-tertiary)',
              padding: '0 2px',
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

      {/* 4) 방해 금지 시간 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>방해 금지 시간</CardTitle>
          <CardSubtitle>이 시간에는 알림이 소리·진동 없이 표시됩니다.</CardSubtitle>
        </CardHeader>
        <CardContent>
          <SettingRow
            icon={<Moon size={18} strokeWidth={1.9} />}
            tone="brand"
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
          {quietHoursEnabled && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginTop: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'var(--text-label-sm)',
                    color: 'var(--fg-tertiary)',
                    marginBottom: 6,
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
                    fontSize: 'var(--text-label-sm)',
                    color: 'var(--fg-tertiary)',
                    marginBottom: 6,
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

      {/* 5) 소리·진동 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>소리·진동</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <SelectTrigger className="w-28">
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
        </CardContent>
      </Card>

      {/* 6) 이메일 알림 */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>이메일 알림</CardTitle>
          <CardSubtitle>앱을 잘 안 열어도 이메일로 요약을 받아볼 수 있어요.</CardSubtitle>
        </CardHeader>
        <CardContent>
          <SettingRow
            icon={<Mail size={18} strokeWidth={1.9} />}
            tone="info"
            title="이메일 받기"
            description={currentUser?.userEmail ?? '이메일 요약 수신'}
            control={
              <Switch
                checked={emailEnabled}
                disabled={calmDisabled}
                onCheckedChange={(v) => updateMut.mutate({ emailEnabled: v })}
              />
            }
          />
          {emailEnabled && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 'var(--text-label-sm)',
                  color: 'var(--fg-tertiary)',
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
                  <ToggleGroupItem key={o.value} value={o.value}>
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
            fontSize: 'var(--text-caption)',
            color: 'var(--fg-expense)',
          }}
        >
          저장에 실패했어요. 잠시 뒤 다시 시도해주세요.
        </div>
      )}
    </ManagerShell>
  )
}
