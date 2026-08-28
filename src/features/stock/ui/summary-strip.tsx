/**
 * 요약 스트립 — 화면 맨 위 전폭 타일 줄. **증권사와 무관하다.**
 *
 * 예전엔 평가금액이 좌측 좁은 단(320~400px) 안에 카드로 눌려 있었고, 그 위 전폭은
 * 나무의 `국내/해외` 탭이 차지했다. 화면에서 제일 중요한 숫자가 제일 좁은 자리에 있고
 * 제일 좋은 자리를 **엔드포인트가 갈린다는 서버 사정**이 먹고 있었다.
 *
 * 그래서 자리를 맞바꿨다. 요약이 위로 올라오고, 좌측 단은 목록 전용이 된다.
 *
 * **타일은 있는 것만 만든다.** 증권사가 못 주는 값의 자리를 `—` 로 남겨 두지 않는다 —
 * 빈 슬롯은 로딩이 안 끝난 것처럼 보인다. 그래서 `tiles` 는 호출부가 걸러서 넘긴다.
 */
import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

/** 타일 하나. `value` 가 없으면 호출부가 아예 안 넘긴다(빈 슬롯 금지). */
export interface StatTile {
  /** React key. 증권사가 타일 구성을 바꿔도 순서가 안 튀게 한다. */
  id: string
  label: string
  value: ReactNode
  sub?: ReactNode
  /** 값에 입힐 색. 손익처럼 부호가 있는 값만 쓴다. */
  tone?: string
  /** 지수 추이선 등 값 아래 붙는 그래픽. */
  graphic?: ReactNode
  /** 첫 타일(평가금액)은 더 크고 넓게. 한 스트립에 하나만. */
  hero?: boolean
}

/**
 * 타일 줄. 데스크톱은 hero 를 1.55 배로 두고 나머지를 균등 분할하고,
 * 모바일은 hero 를 카드로 세운 뒤 나머지를 가로 스크롤 칩으로 눕힌다.
 */
export function SummaryStrip({ tiles, mobile, loading }: { tiles: StatTile[]; mobile: boolean; loading?: boolean }) {
  if (loading) {
    return <Skeleton style={{ height: mobile ? 150 : 92, borderRadius: 'var(--radius-lg)' }} />
  }
  if (tiles.length === 0) return null

  const hero = tiles.find(t => t.hero)
  const rest = tiles.filter(t => !t.hero)

  // ---- 모바일: hero 는 keep 카드(raised + shadow-lg), 나머지는 가로 스크롤 ----
  // 모바일 카드 다이어트에서 투자 요약은 유지되는 카드다(design StocksScreen).
  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hero && (
          <Card variant="raised" style={{ padding: 18 }}>
            <TileBody tile={hero} big />
          </Card>
        )}
        {rest.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {rest.map(t => (
              <Card key={t.id} variant="bordered" style={{ padding: '9px 12px', flex: 'none' }}>
                <TileBody tile={t} compact />
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ---- 데스크톱: 전폭 그리드. hero 가 넓다 ----
  const cols = hero ? `1.55fr repeat(${rest.length}, minmax(0, 1fr))` : `repeat(${rest.length}, minmax(0, 1fr))`
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 10 }}>
      {hero && (
        <Card style={{ padding: '13px 16px' }}>
          <TileBody tile={hero} big />
        </Card>
      )}
      {rest.map(t => (
        <Card key={t.id} style={{ padding: '13px 15px' }}>
          <TileBody tile={t} />
        </Card>
      ))}
    </div>
  )
}

function TileBody({ tile, big, compact }: { tile: StatTile; big?: boolean; compact?: boolean }) {
  const valueSize = big ? 27 : compact ? 13 : 19
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 1 : 3, minWidth: 0 }}>
      <span style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-tertiary)' }}>{tile.label}</span>
      <span
        className="num"
        style={{
          fontSize: valueSize,
          fontWeight: 800,
          letterSpacing: '-0.015em',
          color: tile.tone ?? 'var(--fg-primary)',
          whiteSpace: 'nowrap',
        }}
      >
        {tile.value}
      </span>
      {tile.sub && (
        <span
          style={{
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tile.sub}
        </span>
      )}
      {tile.graphic}
    </div>
  )
}

/**
 * 스트립 아래 얇은 한 줄 — 장 상태 + 데이터 출처.
 *
 * **나무는 왼쪽이 비어 있다.** 나무 스펙에 휴장일·영업일 캘린더가 아예 없어서다
 * (`nhplug.com/llms.txt` 국내 31개 엔드포인트에 없고, 해외는 파생 장운영정보뿐).
 * 없는 걸 지어내지 않고 출처만 남긴다 — 줄 자체는 유지해 두 화면의 세로 리듬을 맞춘다.
 */
export function MarketStatusLine({ children, notice, mobile }: { children?: ReactNode; notice: string; mobile: boolean }) {
  // 모바일은 출처 문구를 숨기므로, 장 상태까지 없으면 **줄 자체가 빈 칸**이 된다.
  // 나무 모바일이 정확히 그 경우다 — 빈 슬롯은 로딩이 안 끝난 것처럼 보이므로 아예 안 그린다.
  // (데스크톱은 출처가 우측에 남아 줄이 비지 않는다.)
  if (mobile && !children) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: mobile ? 8 : 16,
        flexWrap: 'wrap',
        minHeight: 18,
        padding: '0 3px',
        fontSize: 'var(--text-badge)',
        color: 'var(--fg-tertiary)',
      }}
    >
      {children}
      {!mobile && <span style={{ marginLeft: 'auto' }}>{notice}</span>}
    </div>
  )
}
