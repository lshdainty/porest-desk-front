import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Apple, Check, Copy, Download, Smartphone } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

/**
 * 앱 받기 — 로그인 없이 열리는 공개 페이지.
 *
 * <p>스토어에 올리지 않고 서버에서 직접 받아 설치한다. 파일은 nginx 가 정적으로
 * 내보내고(`/download/`), 이 페이지는 그 옆의 `version.json` 을 읽어 최신 버전을 보여 준다.
 *
 * <p>iOS 는 서명 없이 빌드한 IPA 라 받는 사람이 자기 Apple ID 로 서명해 넣어야 한다.
 * 일반 사용자에게 권할 경로가 아니라서 안내만 하고 웹으로 유도한다.
 */

const DOWNLOAD_BASE = '/download'

type AppRelease = {
  version: string
  buildNumber: number
  releasedAt: string
  android: string
  ios: string
}

export const DownloadPage = () => {
  const { t } = useTranslation('download')
  const [release, setRelease] = useState<AppRelease | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  // AltStore 에 붙여 넣을 주소. 이 페이지가 어디에 떠 있든 그 호스트를 그대로 쓴다.
  const sourceUrl = `${window.location.origin}${DOWNLOAD_BASE}/altstore.json`

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(sourceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드가 막힌 브라우저(비 HTTPS 등) — 주소는 눈에 보이니 직접 긁으면 된다.
    }
  }

  useEffect(() => {
    // 배포 전이거나 파일이 아직 없으면 조용히 접는다 — 링크는 그대로 두고 버전만 감춘다.
    fetch(`${DOWNLOAD_BASE}/version.json`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: AppRelease) => setRelease(d))
      .catch(() => setFailed(true))
  }, [])

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-canvas)',
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '32rem', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <header style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-display-sm)', fontWeight: 800, color: 'var(--fg-primary)' }}>
            {t('title')}
          </div>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', marginTop: 6 }}>
            {release
              ? t('subtitleWithVersion', { version: release.version, build: release.buildNumber })
              : failed
                ? t('subtitleNoRelease')
                : t('subtitleLoading')}
          </div>
        </header>

        {/* 안드로이드 — 받아서 바로 설치된다. */}
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={18} style={{ color: 'var(--fg-secondary)' }} />
            <span style={{ fontSize: 'var(--text-body-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
              {t('android.title')}
            </span>
          </div>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)', lineHeight: 1.7, margin: 0 }}>
            {t('android.desc')}
          </p>
          <Button asChild size="md" disabled={!release}>
            <a href={release ? `${DOWNLOAD_BASE}/${release.android}` : undefined}>
              <Download size={16} /> {t('android.cta')}
            </a>
          </Button>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', lineHeight: 1.7, margin: 0 }}>
            {t('android.note')}
          </p>
        </Card>

        {/* iOS — 서명이 없어 그대로는 안 깔린다. 무엇이 필요한지 먼저 알린다. */}
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Apple size={18} style={{ color: 'var(--fg-secondary)' }} />
            <span style={{ fontSize: 'var(--text-body-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
              {t('ios.title')}
            </span>
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-sunken)',
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-secondary)',
              lineHeight: 1.7,
            }}
          >
            {t('ios.warning')}
          </div>

          {/* AltStore 소스 — 7일마다 다시 서명하는 수고를 없애는 유일한 길이라 먼저 권한다. */}
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)', lineHeight: 1.7, margin: 0 }}>
            {t('ios.altstoreDesc')}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code
              style={{
                flex: 1,
                minWidth: 0,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-sunken)',
                fontSize: 'var(--text-caption)',
                color: 'var(--fg-primary)',
              }}
            >
              {sourceUrl}
            </code>
            <Button size="md" variant="secondary" onClick={copySource}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t('ios.copied') : t('ios.copy')}
            </Button>
          </div>

          {/* 직접 받는 길도 남겨 둔다 — Sideloadly 처럼 IPA 를 직접 먹이는 도구를 쓸 때. */}
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', lineHeight: 1.7, margin: 0 }}>
            {t('ios.desc')}
          </p>
          <Button asChild size="md" variant="ghost" disabled={!release}>
            <a href={release ? `${DOWNLOAD_BASE}/${release.ios}` : undefined}>
              <Download size={16} /> {t('ios.cta')}
            </a>
          </Button>
        </Card>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', lineHeight: 1.7 }}>
          {t('webHint')}
        </p>
      </div>
    </div>
  )
}
