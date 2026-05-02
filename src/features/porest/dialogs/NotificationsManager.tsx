import { useUpdateUserPreferences, useUserPreferences } from '@/features/user'
import { Card } from '@/shared/ui/card'

export function NotificationsManager({ mobile }: { mobile: boolean }) {
  const preferencesQ = useUserPreferences()
  const updateMut = useUpdateUserPreferences()

  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85

  return (
    <div className="cat-mgr">
      {!mobile && (
        <div className="cat-mgr__head">
          <div>
            <h2 className="cat-mgr__title">알림 설정</h2>
            <p className="cat-mgr__sub">
              예산 초과·결제 예정 등 이벤트 알림 임계와 동작을 설정합니다.
            </p>
          </div>
        </div>
      )}

      <Card style={{ padding: 22 }}>
        <div className="sec-head" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 15 }}>예산 알림 임계값</h2>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--fg-tertiary)' }}>
            현재 <strong style={{ color: 'var(--fg-brand-strong)' }}>{warnThreshold}%</strong>
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--fg-secondary)',
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          예산 사용률이 이 값을 넘으면 <strong>경고</strong> 상태로 표시되고 알림을 받습니다.
          100%는 <strong>초과</strong>로 별도 알림이 발생합니다.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={warnThreshold}
            onChange={(e) => {
              const v = Number(e.target.value)
              updateMut.mutate({ budgetAlertThreshold: v })
            }}
            disabled={preferencesQ.isLoading || updateMut.isPending}
            style={{ flex: 1, accentColor: 'var(--mossy-600)' }}
          />
          <span
            className="num"
            style={{ fontSize: 14, fontWeight: 700, minWidth: 44, textAlign: 'right' }}
          >
            {warnThreshold}%
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10.5,
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
          <div style={{ fontSize: 11.5, color: 'var(--berry-700)', marginTop: 6 }}>
            저장에 실패했어요. 잠시 뒤 다시 시도해주세요.
          </div>
        )}
      </Card>
    </div>
  )
}
