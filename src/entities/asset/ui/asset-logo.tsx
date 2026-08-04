import { useState, type CSSProperties } from 'react'
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import type { Asset } from '../model/types'

function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) & 0xffffffff
  return Math.abs(h) % 360
}

type AssetLogoInput = Pick<Asset, 'assetName' | 'institution' | 'color'> &
  Partial<Pick<Asset, 'cardCatalog'>>

/**
 * 자산 식별 타일 — 카드 정식 이미지가 있으면 그 이미지, 없으면 첫 글자 모노그램 + 브랜드색 배경.
 * 자산 목록·관리·상세·생성/수정 미리보기에서 동일하게 사용하는 단일 표현.
 *
 * 카드 이미지는 카탈로그(외부 URL)라 깨질 수 있어, 로드에 실패하면 모노그램으로 되돌린다.
 * 색 우선순위: asset.color(생성 시 저장한 회사 primary) → bank-colors 매칭색 → 자산명 해시색.
 * 글자색은 bank-colors 의 fg(밝은 배경 전용) → 기본 흰색.
 */
export function AssetLogo({
  asset,
  size = 40,
  style,
}: {
  asset: AssetLogoInput
  size?: number
  style?: CSSProperties
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const imgUrl = asset.cardCatalog?.imgUrl

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt=""
        onError={() => setImgFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-tile)',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
      />
    )
  }

  const label = (asset.institution ?? asset.assetName ?? '?').trim().charAt(0) || '?'
  const brand = getBrandColor(asset.institution, asset.assetName)
  const bg = asset.color ?? brand?.bg ?? `oklch(0.55 0.12 ${hashHue(asset.assetName ?? 'asset')})`
  const fg = brand?.fg ?? '#fff'
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-tile)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize:
          size <= 32 ? 'var(--text-caption)' : size >= 48 ? 'var(--text-body-lg)' : 'var(--text-body-sm)',
        fontWeight: '800',
        letterSpacing: '-0.022em',
        flexShrink: 0,
        background: bg,
        color: fg,
        ...style,
      }}
    >
      {label}
    </span>
  )
}
