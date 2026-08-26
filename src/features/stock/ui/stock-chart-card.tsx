/**
 * 종목 캔들 차트 카드 — 차트 + 기간 세그먼트.
 *
 * **캔들은 토스 크리덴셜을 요구한다.** 백엔드 캔들 경로는 `/api/v1/toss/candles` 하나뿐이고
 * (`TossApiController#getCandles`), 그 뒤의 `TossApiClient` 는 본인 토스 키가 없으면
 * `SECURITIES_CREDENTIAL_REQUIRED` 를 낸다. 나무만 연결한 사용자가 부르면 실패한다 —
 * `useLivePrices` 가 토스 캔들 폴백을 증권사로 막아 둔 것과 같은 사정이다.
 *
 * 그래서 여기서 **연결 여부를 보고 가른다.** 못 그릴 때 빈 캔버스를 남기면 사용자는 로딩이
 * 끝나기를 기다린다 — 이유를 적어 준다. 나무 종목이라도 토스를 함께 연결했으면 그린다
 * (캔들에 필요한 건 종목이 아니라 크리덴셜이다).
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { LightweightStockChart } from './LightweightStockChart'

const RANGES = ['1D', '1주', '1개월', '3개월', '1년'] as const
type Range = (typeof RANGES)[number]
// 기간 값은 LightweightStockChart·임베드 querystring 의 식별자이므로 보존하고, 표시 라벨만 i18n.
const RANGE_LABEL_KEY: Record<Range, string> = {
  '1D': 'range.1d',
  '1주': 'range.1w',
  '1개월': 'range.1m',
  '3개월': 'range.3m',
  '1년': 'range.1y',
}

/**
 * 캔들을 그릴 수 있는가 = 토스가 연결돼 있는가.
 *
 * **아직 모르는 상태를 `false` 로 뭉개지 않는다.** 연결 정보가 오기 전에 '못 그린다' 로
 * 단정하면 토스 사용자에게 첫 프레임마다 "토스 연결이 필요해요" 가 번쩍인다. 반대로
 * `true` 로 뭉개면 나무 사용자가 실패할 캔들 요청을 낸다. 그래서 셋으로 가른다.
 */
type CandleAvailability = 'yes' | 'no' | 'unknown'

function useCandleAvailability(): CandleAvailability {
  const { data: features, isLoading } = useMyFeatures()
  if (isLoading || !features) return 'unknown'
  return (features.connectedBrokers ?? []).includes('TOSS') ? 'yes' : 'no'
}

export function StockChartCard({ symbol, isUs, mobile }: { symbol: string; isUs: boolean; mobile: boolean }) {
  const { t } = useTranslation('stocks')
  const [range, setRange] = useState<Range>('1D')
  const availability = useCandleAvailability()
  const height = mobile ? 168 : 200

  return (
    <Card style={{ padding: mobile ? '14px 14px 14px' : '16px 18px 16px' }}>
      <div style={{ height }}>
        {availability === 'yes' ? (
          <LightweightStockChart symbol={symbol} isUs={isUs} range={range} height={height} />
        ) : availability === 'unknown' ? null : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textAlign: 'center',
              color: 'var(--fg-tertiary)',
            }}
          >
            <LineChart size={28} />
            <div style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.5 }}>{t('chart.tossOnly')}</div>
          </div>
        )}
      </div>
      {availability !== 'no' && (
        <div style={{ marginTop: 8 }}>
          <Tabs value={range} onValueChange={v => setRange(v as Range)}>
            <TabsList variant="pill" size="sm" style={{ width: '100%' }}>
              {RANGES.map(r => (
                <TabsTrigger key={r} variant="pill" value={r} style={{ flex: 1 }}>
                  {t(RANGE_LABEL_KEY[r])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
    </Card>
  )
}
