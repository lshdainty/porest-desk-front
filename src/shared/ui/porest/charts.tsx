import { useRef, useState, type ReactNode } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/shared/ui/chart'
import { KRW } from '@/shared/lib/porest/format'

export function Sparkline({
  values,
  height = 40,
  color = 'var(--mossy-500)',
  fill = true,
}: {
  values: number[]
  height?: number
  color?: string
  fill?: boolean
}) {
  if (!values || values.length === 0) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 200
  const h = height
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 8) - 4
    return [x, y] as [number, number]
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const fillD = fill ? `${d} L${w},${h} L0,${h} Z` : ''
  const gradId = `sparkfill-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mini-sparkline" style={{ height }}>
      {fill && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={fillD} fill={`url(#${gradId})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts[pts.length - 1] && (
        <circle cx={pts[pts.length - 1]![0]} cy={pts[pts.length - 1]![1]} r="3.5" fill={color} />
      )}
    </svg>
  )
}

export interface LineSeries {
  label: string
  values: number[]
}

export function LineChart({
  series,
  labels,
  height = 200,
  colors = ['var(--mossy-500)', 'var(--berry-500)'],
  yFormat,
}: {
  series: LineSeries[]
  labels: string[]
  height?: number
  colors?: string[]
  yFormat?: (v: number) => string
}) {
  const w = 600
  const h = height
  const padL = 40, padR = 16, padT = 16, padB = 28
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const all = series.flatMap(s => s.values)
  const max = Math.max(...all)
  const min = 0
  const range = max - min || 1
  const step = innerW / (labels.length - 1)

  const yTicks = 4
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i) / yTicks)

  const fmt = yFormat || ((v: number) => (v >= 10000 ? `${KRW(v)}원` : `${v.toLocaleString('ko-KR')}원`))
  const fmtAxis = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)

  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ i: number } | null>(null)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xRatio = (e.clientX - rect.left) / rect.width
    const xVB = xRatio * w
    const localX = xVB - padL
    if (localX < -step / 2 || localX > innerW + step / 2) {
      setHover(null)
      return
    }
    const i = Math.max(0, Math.min(labels.length - 1, Math.round(localX / step)))
    setHover({ i })
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="line-chart"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        {tickVals.map((v, i) => {
          const y = padT + innerH - (v / range) * innerH
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
              <text
                x={padL - 6}
                y={y + 3}
                fontSize="10"
                fill="var(--mist-500)"
                textAnchor="end"
                fontFamily="var(--font-sans)"
              >
                {fmtAxis(v)}
              </text>
            </g>
          )
        })}
        {labels.map((l, i) => (
          <text
            key={i}
            x={padL + i * step}
            y={h - padB + 16}
            fontSize="10"
            fill="var(--mist-500)"
            textAnchor="middle"
            fontFamily="var(--font-sans)"
          >
            {l}
          </text>
        ))}
        {series.map((s, si) => {
          const c = colors[si] || colors[0]
          const pts = s.values.map(
            (v, i) => [padL + i * step, padT + innerH - ((v - min) / range) * innerH] as [number, number],
          )
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
          return (
            <g key={si}>
              <path d={d} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={hover && hover.i === i ? 4.5 : i === pts.length - 1 ? 4 : 2.5}
                  fill={c}
                  stroke="var(--bg-surface)"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )
        })}
        {hover && (
          <line
            x1={padL + hover.i * step}
            x2={padL + hover.i * step}
            y1={padT}
            y2={padT + innerH}
            stroke="var(--fg-tertiary)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        )}
      </svg>
      {hover &&
        (() => {
          const xPct = ((padL + hover.i * step) / w) * 100
          const placeRight = xPct < 50
          return (
            <div
              style={{
                position: 'absolute',
                top: 8,
                [placeRight ? 'left' : 'right']: `calc(${placeRight ? xPct : 100 - xPct}% + 12px)`,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-md)',
                padding: '8px 12px',
                fontSize: 11.5,
                pointerEvents: 'none',
                minWidth: 120,
                zIndex: 5,
              } as React.CSSProperties}
            >
              <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4 }}>
                {labels[hover.i]}
              </div>
              {series.map((s, si) => (
                <div
                  key={si}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: si > 0 ? 3 : 0 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: colors[si] || colors[0],
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{s.label}</span>
                  <span
                    className="num"
                    style={{
                      marginLeft: 'auto',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--fg-primary)',
                    }}
                  >
                    {fmt(s.values[hover.i] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}
    </div>
  )
}

export interface BarPoint {
  label: string
  income: number
  expense: number
}

export function BarChart({ data, height = 200 }: { data: BarPoint[]; height?: number }) {
  const w = 600
  const h = height
  const padL = 40, padR = 16, padT = 16, padB = 28
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]))
  const groupW = innerW / data.length
  const barW = Math.min(14, groupW / 3)

  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ i: number } | null>(null)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xRatio = (e.clientX - rect.left) / rect.width
    const xVB = xRatio * w
    const localX = xVB - padL
    if (localX < 0 || localX > innerW) {
      setHover(null)
      return
    }
    const i = Math.max(0, Math.min(data.length - 1, Math.floor(localX / groupW)))
    setHover({ i })
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="line-chart"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + innerH - p * innerH
          const v = max * p
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={w - padR}
                y1={y}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray={i === 0 ? '0' : '3 3'}
              />
              <text x={padL - 6} y={y + 3} fontSize="10" fill="var(--mist-500)" textAnchor="end">
                {v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : ''}
              </text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const cx = padL + i * groupW + groupW / 2
          const yIn = padT + innerH - (d.income / max) * innerH
          const yEx = padT + innerH - (d.expense / max) * innerH
          const isHover = hover && hover.i === i
          return (
            <g key={i}>
              {isHover && (
                <rect x={padL + i * groupW} y={padT} width={groupW} height={innerH} fill="var(--mossy-500)" opacity="0.06" />
              )}
              <rect
                x={cx - barW - 2}
                y={yIn}
                width={barW}
                height={padT + innerH - yIn}
                rx="3"
                fill="var(--mossy-500)"
                opacity={isHover ? 1 : 0.92}
              />
              <rect
                x={cx + 2}
                y={yEx}
                width={barW}
                height={padT + innerH - yEx}
                rx="3"
                fill="var(--berry-500)"
                opacity={isHover ? 1 : 0.92}
              />
              <text x={cx} y={h - padB + 16} fontSize="10" fill="var(--mist-500)" textAnchor="middle">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover &&
        (() => {
          const d = data[hover.i]
          if (!d) return null
          const xPct = ((padL + hover.i * groupW + groupW / 2) / w) * 100
          const placeRight = xPct < 50
          return (
            <div
              style={{
                position: 'absolute',
                top: 8,
                [placeRight ? 'left' : 'right']: `calc(${placeRight ? xPct : 100 - xPct}% + 12px)`,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-md)',
                padding: '8px 12px',
                fontSize: 11.5,
                pointerEvents: 'none',
                minWidth: 130,
                zIndex: 5,
              } as React.CSSProperties}
            >
              <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4 }}>
                {d.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--mossy-500)' }} />
                <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>수입</span>
                <span className="num" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>
                  {KRW(d.income)}원
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--berry-500)' }} />
                <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>지출</span>
                <span className="num" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>
                  {KRW(d.expense)}원
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 5,
                  paddingTop: 5,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>저축</span>
                <span
                  className="num"
                  style={{
                    marginLeft: 'auto',
                    fontSize: 12,
                    fontWeight: 700,
                    color: d.income - d.expense >= 0 ? 'var(--mossy-700)' : 'var(--berry-600)',
                  }}
                >
                  {d.income - d.expense >= 0 ? '+' : '−'}
                  {KRW(Math.abs(d.income - d.expense))}원
                </span>
              </div>
            </div>
          )
        })()}
    </div>
  )
}

export interface DonutSegment {
  value: number
  color: string
  label?: string
}

export function Donut({
  segments,
  size = 160,
  stroke = 22,
  children,
}: {
  segments: DonutSegment[]
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const outerRadius = size / 2
  const innerRadius = Math.max(0, outerRadius - stroke)
  const data = segments.map((s, i) => ({
    name: s.label ?? `seg-${i}`,
    value: Math.max(0, s.value),
    fill: s.color,
  }))
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name || `seg-${i}`, { label: d.name, color: segments[i].color }]),
  )
  // 빈 데이터면 mist-200 링만 렌더.
  const hasValue = data.some(d => d.value > 0)
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <ChartContainer config={config} style={{ width: size, height: size, aspectRatio: '1 / 1' }}>
        <PieChart width={size} height={size}>
          {!hasValue && (
            <Pie
              data={[{ value: 1, fill: 'var(--pd-surface-inset)' }]}
              dataKey="value"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              stroke="none"
            />
          )}
          {hasValue && (
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              stroke="none"
              isAnimationActive
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
          )}
        </PieChart>
      </ChartContainer>
      <div className="center">{children}</div>
    </div>
  )
}
