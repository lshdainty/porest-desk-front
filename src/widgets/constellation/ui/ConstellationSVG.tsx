import { useMemo } from 'react'
import { parseStarMap } from '@/features/constellation'

/**
 * 별자리 SVG 렌더러 — 0-100 정규 좌표(pts) + 연결선(edges), currentColor 기반.
 * lit: 켜진 별 개수(해당 인덱스 미만 점등, 미지정 시 전부). dim: 미수집 실루엣 톤.
 * 디자인 SoT: 클로드 디자인 forest.jsx ConstellationSVG.
 */
export function ConstellationSVG({
  starMap,
  lit,
  size = 24,
  dim = false,
}: {
  starMap: string
  lit?: number
  size?: number
  dim?: boolean
}) {
  const map = useMemo(() => parseStarMap(starMap), [starMap])
  const n = lit == null ? map.pts.length : lit
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      {map.edges.map(([a, b], i) => {
        const pa = map.pts[a]
        const pb = map.pts[b]
        if (!pa || !pb || a >= n || b >= n) return null
        return (
          <line
            key={i}
            x1={pa[0]}
            y1={pa[1]}
            x2={pb[0]}
            y2={pb[1]}
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={dim ? 0.35 : 0.55}
          />
        )
      })}
      {map.pts.map(([x, y], i) =>
        i < n ? (
          <circle key={i} cx={x} cy={y} r={3.4} fill="currentColor" opacity={dim ? 0.55 : 1} />
        ) : (
          <circle key={i} cx={x} cy={y} r={2.6} fill="none" stroke="currentColor" strokeWidth={1.4} opacity={0.4} />
        ),
      )}
    </svg>
  )
}
