import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Monitor, Smartphone, Tablet, CircleHelp, MonitorOff } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Skeleton } from '@/shared/ui/skeleton'
import { parseServerUtc } from '@/shared/lib/date'
import { useAuth } from '@/features/auth/model/useAuth'
import {
  useDeviceSessions,
  useRevokeDeviceMutation,
  useRevokeAllDevicesMutation,
} from '@/features/session'
import type { DeviceKind, DeviceSession } from '@/features/session'

/** 아이콘은 서버가 준 형태로 고른다 — 기기 이름 문자열을 여기서 다시 뜯지 않는다. */
const KIND_ICON: Record<DeviceKind, typeof Monitor> = {
  MOBILE: Smartphone,
  TABLET: Tablet,
  DESKTOP: Monitor,
  UNKNOWN: CircleHelp,
}

/**
 * "로그인된 기기" — 계정 > 보안에서 들어온다.
 *
 * 이 계정으로 살아 있는 세션을 기기별로 보여 주고, 낯선 기기를 끊게 한다.
 * 목록·해지 모두 desk 백엔드만 부른다(SSO 왕복 없음) — desk 가 로그인마다 자기
 * 세션 테이블에 한 행을 남기기 때문이다.
 */
export function DevicesSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('settings')
  const { logout } = useAuth()
  const { data: devices = [], isLoading, isError, dataUpdatedAt } = useDeviceSessions()
  const revoke = useRevokeDeviceMutation()
  const revokeAll = useRevokeAllDevicesMutation()

  const [confirming, setConfirming] = useState<DeviceSession | null>(null)
  const [confirmingAll, setConfirmingAll] = useState(false)

  const onRevoke = async (device: DeviceSession) => {
    await revoke.mutateAsync(device.sessionId)
    setConfirming(null)
    // 지금 이 브라우저를 끊었으면 여기 머물 이유가 없다 — 다음 요청마다 401 이 난다.
    if (device.current) await logout()
  }

  const onRevokeAll = async () => {
    await revokeAll.mutateAsync()
    setConfirmingAll(false)
    // 전부 끊었으니 이 브라우저도 끊겼다.
    //
    // 성공 토스트는 띄우지 않는다 — 확인 다이얼로그에서 "다시 로그인해야 해요" 라고
    // 이미 말했고, 로그인 화면으로 떨어지는 것 자체가 결과다.
    await logout()
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Skeleton style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton style={{ width: '40%', height: 14 }} />
              <Skeleton style={{ width: '25%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-danger)' }}>
        {t('devices.loadError')}
      </p>
    )
  }

  if (devices.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: '32px 0', color: 'var(--fg-tertiary)',
      }}>
        <MonitorOff size={48} strokeWidth={1.5} />
        <p style={{ margin: 0, fontSize: 14 }}>{t('devices.empty')}</p>
      </div>
    )
  }

  return (
    <>
      <div>
        {devices.map((d, i) => (
          <DeviceRow
            key={d.sessionId}
            device={d}
            now={dataUpdatedAt}
            isFirst={i === 0}
            busy={revoke.isPending && revoke.variables === d.sessionId}
            onRevoke={() => setConfirming(d)}
          />
        ))}
      </div>

      {/* 비상 버튼이라 목록 아래에 둔다 — 위에 두면 기기 하나만 끊으려던 손이 먼저 닿는다. */}
      <div style={{ marginTop: 24 }}>
        <Button
          variant="dangerSoft"
          size={mobile ? 'lg' : 'md'}
          style={{ width: '100%' }}
          onClick={() => setConfirmingAll(true)}
        >
          {t('devices.logoutAll')}
        </Button>
      </div>

      {confirming && (
        <ConfirmDialog
          title={t('devices.logoutTitle')}
          message={t('devices.logoutConfirm', {
            device: confirming.deviceLabel ?? t('devices.unknown'),
          })}
          confirmLabel={t('devices.logout')}
          danger
          loading={revoke.isPending}
          onCancel={() => setConfirming(null)}
          onConfirm={() => void onRevoke(confirming)}
        />
      )}

      {confirmingAll && (
        <ConfirmDialog
          title={t('devices.logoutAll')}
          message={t('devices.logoutAllConfirm')}
          confirmLabel={t('devices.logoutAll')}
          danger
          loading={revokeAll.isPending}
          onCancel={() => setConfirmingAll(false)}
          onConfirm={() => void onRevokeAll()}
        />
      )}
    </>
  )
}

/** 기기 한 줄 — 아이콘 + 이름(+현재 기기) + 마지막 사용 + [로그아웃]. */
function DeviceRow({
  device,
  now,
  isFirst,
  busy,
  onRevoke,
}: {
  device: DeviceSession
  /** 상대 시각의 기준점 — 목록을 받아 온 순간. 아래 [relativeTime] 주석 참고. */
  now: number
  isFirst: boolean
  busy: boolean
  onRevoke: () => void
}) {
  const { t } = useTranslation('settings')
  const { t: tDate } = useTranslation('date')
  const when = relativeTime(tDate, device.lastUsedAt ?? device.createAt, now)
  const Icon = KIND_ICON[device.deviceKind] ?? CircleHelp

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderTop: isFirst ? undefined : '1px solid var(--border-subtle)',
      }}
    >
      <span style={{
        width: 36, height: 36, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)',
        color: 'var(--fg-secondary)',
      }}>
        <Icon size={18} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {device.deviceLabel ?? t('devices.unknown')}
          </span>
          {device.current && (
            <span style={{
              flexShrink: 0,
              fontSize: 11, fontWeight: 600, lineHeight: 1.4,
              padding: '2px 6px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-success)', color: 'var(--fg-success)',
            }}>
              {t('devices.current')}
            </span>
          )}
        </div>
        {when && (
          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--fg-tertiary)' }}>
            {t('devices.lastUsed', { when })}
          </div>
        )}
      </div>

      <Button variant="ghost" size="sm" loading={busy} onClick={onRevoke}>
        {t('devices.logout')}
      </Button>
    </div>
  )
}

/**
 * 서버가 준 `[UTC]` 시각 → "방금 · 3분 전 · 어제 · 2026-08-24".
 *
 * [parseServerUtc] 를 거쳐야 한다 — 시간대 없는 문자열을 `new Date` 로 그대로 읽으면
 * UTC 가 로컬로 둔갑해 KST 에서 9시간이 어긋난다.
 *
 * 기준점([now])을 인자로 받는다. 렌더 중에 `Date.now()` 를 부르면 같은 입력이
 * 렌더마다 다른 결과를 내 순수하지 않다(react-hooks/purity). 호출부는 react-query 의
 * `dataUpdatedAt` 을 넘기는데, 뜻도 그쪽이 맞다 — 이 목록은 그 순간의 스냅샷이다.
 */
function relativeTime(
  t: (key: string, opts?: { count: number }) => string,
  iso: string | null,
  now: number,
): string | null {
  const d = parseServerUtc(iso)
  if (!d) return null

  const minutes = Math.floor((now - d.getTime()) / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t('yesterday')
  if (days < 7) return t('daysAgo', { count: days })
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
