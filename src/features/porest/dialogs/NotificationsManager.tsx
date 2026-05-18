import { useUpdateUserPreferences, useUserPreferences } from '@/features/user'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'

export function NotificationsManager({ mobile }: { mobile: boolean }) {
  const preferencesQ = useUserPreferences()
  const updateMut = useUpdateUserPreferences()

  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85
  const isLoading = preferencesQ.isLoading

  return (
    <ManagerShell>
      {!mobile && (
        <ManagerHead
          title="알림 설정"
          description="예산 초과·결제 예정 등 이벤트 알림 임계와 동작을 설정합니다."
        />
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>예산 알림 임계값</CardTitle>
          {isLoading ? (
            <SkeletonBase className="h-3 w-20" />
          ) : (
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              현재 <strong style={{ color: 'var(--fg-brand-strong)' }}>{warnThreshold}%</strong>
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-secondary)',
              marginBottom: 12,
              lineHeight: 'var(--lh-normal)',
            }}
          >
            예산 사용률이 이 값을 넘으면 <strong>경고</strong> 상태로 표시되고 알림을 받습니다.
            100%는 <strong>초과</strong>로 별도 알림이 발생합니다.
          </div>
          <div style={{ marginBottom: 8 }}>
            {isLoading ? (
              <SkeletonBase className="h-1.5 w-full rounded-full" />
            ) : (
              <Slider
                min={50}
                max={100}
                step={5}
                value={[warnThreshold]}
                onValueChange={([v]) => updateMut.mutate({ budgetAlertThreshold: v })}
                disabled={preferencesQ.isLoading || updateMut.isPending}
              />
            )}
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
          {updateMut.isError && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-expense)', marginTop: 6 }}>
              저장에 실패했어요. 잠시 뒤 다시 시도해주세요.
            </div>
          )}
        </CardContent>
      </Card>
    </ManagerShell>
  )
}
