import { useMemo } from 'react'
import { parseStarMap } from '@/features/constellation'

/**
 * 별자리 SVG 렌더러 — 0-100 정규 좌표(pts) + 연결선(edges), currentColor 기반.
 *
 * - linesOnly: 썸네일용(나의 밤하늘 그리드·도감 리스트) — 선만 그려 작은 크기에서 뭉침 방지.
 * - 점 크기는 별 수 적응형(실좌표 별자리는 2~27별) — 많을수록 작게.
 * - lit: 켜진 별 개수(해당 인덱스 미만 점등, 미지정 시 전부). dim: 미수집 실루엣 톤.
 * 디자인 SoT: 클로드 디자인 forest.jsx ConstellationSVG(+v3 실좌표 대응).
 */
export function ConstellationSVG({
  starMap,
  lit,
  size = 24,
  dim = false,
  linesOnly = false,
}: {
  starMap: string
  lit?: number
  size?: number
  dim?: boolean
  linesOnly?: boolean
}) {
  const map = useMemo(() => parseStarMap(starMap), [starMap])
  const n = lit == null ? map.pts.length : lit
  // 별 수 적응형 크기 — 적으면 도톰하게(카시오페이아), 많으면 가늘게(에리다누스)
  const count = map.pts.length
  const rLit = count <= 8 ? 3.4 : count <= 15 ? 2.4 : 1.8
  const rUnlit = count <= 8 ? 2.6 : count <= 15 ? 1.9 : 1.5
  const strokeW = count <= 8 ? 2.2 : count <= 15 ? 1.6 : 1.2

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      {map.edges.map(([a, b], i) => {
        const pa = map.pts[a]
        const pb = map.pts[b]
        if (!pa || !pb) return null
        // linesOnly(썸네일)는 점등 상태와 무관하게 전체 골격을 보여준다
        if (!linesOnly && (a >= n || b >= n)) return null
        return (
          <line
            key={i}
            x1={pa[0]}
            y1={pa[1]}
            x2={pb[0]}
            y2={pb[1]}
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            opacity={dim ? 0.35 : 0.55}
          />
        )
      })}
      {!linesOnly &&
        map.pts.map(([x, y], i) =>
          i < n ? (
            <circle key={i} cx={x} cy={y} r={rLit} fill="currentColor" opacity={dim ? 0.55 : 1} />
          ) : (
            <circle key={i} cx={x} cy={y} r={rUnlit} fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.4} />
          ),
        )}
    </svg>
  )
}
