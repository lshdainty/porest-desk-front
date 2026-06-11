import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Plus,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Users,
  CheckCheck,
  Trash2,
  ChevronLeft,
} from 'lucide-react'
import {
  useDutchPays,
  useCreateDutchPay,
  useMarkParticipantPaid,
  useSettleAll,
  useDeleteDutchPay,
} from '@/features/dutch-pay'
import type { DutchPay, DutchPayParticipant, DutchPayFormValues } from '@/entities/dutch-pay'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { KRW } from '@/shared/lib/porest/format'
import { MaskAmount, HideUnit } from '@/shared/lib/porest/hide-amounts'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// ── 아바타 팔레트 ────────────────────────────────────────────────────────────
// 이름 기반 chart 10색 순환(앱 _participantPaletteOklch 정합). alias var = 다크 자동 swap.
const AVATAR_VARS = [
  '--color-cat-blue',
  '--color-cat-green',
  '--color-cat-orange',
  '--color-cat-violet',
  '--color-cat-pink',
  '--color-cat-indigo',
  '--color-cat-red',
  '--color-cat-brown',
  '--color-cat-yellow',
  '--color-cat-gray',
] as const

/** 이름 → 안정적 팔레트 인덱스(문자 코드 합 mod 10). */
function avatarColor(name: string): string {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return `var(${AVATAR_VARS[sum % AVATAR_VARS.length]})`
}

const initial = (name: string) => (name && name.length > 0 ? name[0]! : '?')

// ── 모델 헬퍼 ────────────────────────────────────────────────────────────────
/** 결제자(나) = userRowId 보유 참여자 또는 첫 번째. */
function payerOf(d: DutchPay): DutchPayParticipant | undefined {
  return d.participants.find(p => p.userRowId != null) ?? d.participants[0]
}
function isPayer(d: DutchPay, p: DutchPayParticipant): boolean {
  return payerOf(d)?.rowId === p.rowId
}
function paidCountOf(d: DutchPay): number {
  return d.participants.filter(p => p.isPaid).length
}
function perPersonOf(d: DutchPay): number {
  return d.participants.length > 0 ? Math.floor(d.totalAmount / d.participants.length) : 0
}

// ── 날짜 유틸 ────────────────────────────────────────────────────────────────
const DOW = ['일', '월', '화', '수', '목', '금', '토']

function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
/** 'YYYY-MM-DD'(또는 datetime) → 'M월 D일'. */
function kDateMd(s: string): string {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return s
  return `${m}월 ${d}일`
}
/** 'YYYY-MM-DD' → 'M월 D일 (요일)'. */
function kDateFull(s: string): string {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return s
  const dow = DOW[new Date(y, m - 1, d).getDay()]
  return `${m}월 ${d}일 (${dow})`
}

// '진행/완료' = isSettled.
function isActiveSession(d: DutchPay): boolean {
  return !d.isSettled
}

type TabKey = 'active' | 'past' | 'friends'

/** DutchPayPage 진입 시 사용하는 useQuery 의 isLoading 집계. */
function useDutchPayPageData() {
  const q = useDutchPays()
  return { isLoading: q.isLoading }
}

export const DutchPayPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useDutchPayPageData()
  if (isLoading) return <DutchPayPageSkeleton mobile={mobile} />
  return <DutchPayPageInner mobile={mobile} />
}

const DutchPayPageInner = ({ mobile }: { mobile: boolean }) => {
  const dutchPaysQ = useDutchPays()
  const createDutchPay = useCreateDutchPay()
  const markPaid = useMarkParticipantPaid()
  const settleAll = useSettleAll()
  const deleteDutchPay = useDeleteDutchPay()

  const list: DutchPay[] = useMemo(() => dutchPaysQ.data ?? [], [dutchPaysQ.data])
  const today = useMemo(() => todayISO(), [])

  const [tab, setTab] = useState<TabKey>('active')
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const active = useMemo(() => list.filter(isActiveSession), [list])
  const past = useMemo(() => list.filter(d => d.isSettled), [list])
  const detail = useMemo(
    () => (detailId != null ? list.find(d => d.rowId === detailId) ?? null : null),
    [list, detailId],
  )

  // 받을 돈 = 미정산 세션들의 미지불 참여자(결제자 제외) amount 합 + 미지불 인원 수.
  const receivable = useMemo(() => {
    let amount = 0
    let people = 0
    for (const d of active) {
      for (const p of d.participants) {
        if (isPayer(d, p) || p.isPaid) continue
        amount += p.amount
        people += 1
      }
    }
    return { amount, people }
  }, [active])

  // 보낼 돈 = 현행 모델에 '내가 보낼' 데이터 없음 → 0 처리 (구조만 유지, 추후 API 확장).
  const payable = { amount: 0, people: 0 }

  // 친구 집계: participantName 기반(결제자/나 제외) — N회 함께 정산 + net(미지불 amount 합).
  const friends = useMemo(() => {
    const map = new Map<string, { name: string; sessions: number; net: number }>()
    for (const d of list) {
      const payer = payerOf(d)
      for (const p of d.participants) {
        if (payer && p.rowId === payer.rowId) continue
        const key = p.participantName
        const cur = map.get(key) ?? { name: key, sessions: 0, net: 0 }
        cur.sessions += 1
        if (isActiveSession(d) && !p.isPaid) cur.net += p.amount
        map.set(key, cur)
      }
    }
    return [...map.values()].sort((a, b) => b.sessions - a.sessions || b.net - a.net)
  }, [list])

  // 데스크톱 우측: 자주 정산 친구 Top5 + 이번 달 정산 통계.
  const topFriends = useMemo(() => friends.slice(0, 5), [friends])
  const monthStats = useMemo(() => {
    const ym = today.slice(0, 7)
    const inMonth = list.filter(d => d.dutchPayDate.slice(0, 7) === ym)
    const totalAmount = inMonth.reduce((s, d) => s + d.totalAmount, 0)
    const totalPeople = inMonth.reduce((s, d) => s + d.participants.length, 0)
    const avg = inMonth.length > 0 ? totalPeople / inMonth.length : 0
    return { count: inMonth.length, totalAmount, avg }
  }, [list, today])

  // ── mutations ──────────────────────────────────────────────────────────────
  const onCreate = (values: DutchPayFormValues) => {
    createDutchPay.mutate(values, { onSuccess: () => setCreating(false) })
  }
  const onDelete = (id: number) => {
    deleteDutchPay.mutate(id, { onSuccess: () => setDetailId(null) })
  }
  const onMarkPaid = (dutchPayId: number, participantId: number) => {
    markPaid.mutate({ dutchPayId, participantId })
  }
  const onSettleAll = (id: number) => {
    settleAll.mutate(id)
  }
  // 요청/일괄 요청 = UI-only.
  const onRequest = (name: string) => {
    toast.success(`${name}님에게 송금 요청을 보냈어요`, {
      description: '추후 카카오톡·문자 연동 예정',
    })
  }
  const onRequestAll = (d: DutchPay) => {
    const pending = d.participants.filter(p => !isPayer(d, p) && !p.isPaid)
    if (pending.length === 0) return
    toast.success(`${pending.length}명에게 송금 요청을 보냈어요`, {
      description: '추후 카카오톡·문자 연동 예정',
    })
  }

  // ── 요약 2카드 ─────────────────────────────────────────────────────────────
  const Summary = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: mobile ? 8 : 12,
      }}
    >
      <SummaryCard
        mobile={mobile}
        tone="receive"
        label="받을 돈"
        amount={receivable.amount}
        sub={receivable.people > 0 ? `${receivable.people}명에게서` : '받을 돈 없음'}
      />
      <SummaryCard
        mobile={mobile}
        tone="send"
        label="보낼 돈"
        amount={payable.amount}
        sub={payable.people > 0 ? `${payable.people}명에게` : '0명에게'}
      />
    </div>
  )

  // ── seg 탭 3종 ─────────────────────────────────────────────────────────────
  const TabsSeg = (
    <Tabs value={tab} onValueChange={v => setTab(v as TabKey)} className="w-fit">
      <TabsList variant="pill" size="sm">
        {(
          [
            { id: 'active', label: `진행 중 · ${active.length}` },
            { id: 'past', label: `완료 · ${past.length}` },
            { id: 'friends', label: '친구' },
          ] as const
        ).map(t => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  // ── 콘텐츠 (탭별) ──────────────────────────────────────────────────────────
  let Content: React.ReactNode
  if (tab === 'active') {
    Content =
      active.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="진행 중인 정산이 없어요"
          desc="새 정산을 만들어 함께 쓴 돈을 나눠보세요."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 10 : 12 }}>
          {active.map(d => (
            <SessionCard key={d.rowId} d={d} mobile={mobile} onClick={() => setDetailId(d.rowId)} />
          ))}
        </div>
      )
  } else if (tab === 'past') {
    Content =
      past.length === 0 ? (
        <EmptyState
          icon={<CheckCheck size={24} />}
          title="완료된 정산이 없어요"
          desc="정산을 마치면 여기에 모입니다."
        />
      ) : (
        <Card style={{ padding: '8px 18px' }}>
          {past.map((d, i) => (
            <PastRow key={d.rowId} d={d} first={i === 0} onClick={() => setDetailId(d.rowId)} />
          ))}
        </Card>
      )
  } else {
    Content =
      friends.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="함께 정산한 친구가 없어요"
          desc="정산에 친구를 추가하면 여기에 모입니다."
        />
      ) : (
        <Card style={{ padding: '8px 18px' }}>
          {friends.map((f, i) => (
            <FriendRow key={f.name} f={f} first={i === 0} />
          ))}
        </Card>
      )
  }

  // ── 데스크톱 우측 사이드 ────────────────────────────────────────────────────
  const TopFriendsCard = (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: '700', marginBottom: 14 }}>자주 정산하는 친구</h2>
      {topFriends.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>아직 정산 함께한 친구가 없어요.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topFriends.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={f.name} size={32} />
              <span style={{ fontSize: 13.5, fontWeight: '600', flex: 1, minWidth: 0 }}>{f.name}</span>
              <span className="num" style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: '600' }}>
                {f.sessions}회
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  const MonthStatsCard = (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: '700', marginBottom: 12 }}>이번 달 정산 통계</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StatRow label="만든 정산" value={<><span className="num">{monthStats.count}</span>건</>} />
        <StatRow
          label="총 정산 금액"
          value={
            <>
              <MaskAmount mask="••••">
                <span className="num">{KRW(monthStats.totalAmount)}</span>
              </MaskAmount>
              <HideUnit>원</HideUnit>
            </>
          }
        />
        <StatRow
          label="평균 인원"
          value={<><span className="num">{monthStats.avg.toFixed(1)}</span>명</>}
        />
      </div>
    </Card>
  )

  // ── 만들기 마법사 + 상세 모달 ───────────────────────────────────────────────
  const dialogs = (
    <>
      {creating && (
        <DutchCreateWizard
          mobile={mobile}
          today={today}
          friendNames={friends.map(f => f.name)}
          onClose={() => setCreating(false)}
          onCreate={onCreate}
          submitting={createDutchPay.isPending}
        />
      )}
      {detail && (
        <DutchDetailDialog
          d={detail}
          mobile={mobile}
          onClose={() => setDetailId(null)}
          onMarkPaid={onMarkPaid}
          onRequest={onRequest}
          onRequestAll={onRequestAll}
          onSettleAll={onSettleAll}
          onDelete={onDelete}
          markPaidPending={markPaid.isPending}
          settleAllPending={settleAll.isPending}
          deleting={deleteDutchPay.isPending}
        />
      )}
    </>
  )

  // ── 모바일 ────────────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <>
        <MobileBackHeader title="더치페이" />
        <div style={{ padding: '16px 16px 96px', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Summary}
          {TabsSeg}
          {Content}
        </div>
        <button
          type="button"
          aria-label="정산 만들기"
          onClick={() => setCreating(true)}
          className="m-fab"
          style={{
            position: 'fixed',
            // 풀스크린 페이지(탭바 없음) — 하단 여백 24 (앱 FAB 기본 위치 미러)
            bottom: 24,
            right: 18,
            width: 52,
            height: 52,
            borderRadius: 999,
            border: 0,
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            boxShadow: 'var(--shadow-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
        {dialogs}
        </div>
      </>
    )
  }

  // ── 데스크톱 ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>더치페이</h1>
          <div className="sub">함께 쓴 돈, 깔끔하게 정산</div>
        </div>
        <div className="right">
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> 정산 만들기
          </Button>
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Summary}
            {TabsSeg}
            {Content}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {TopFriendsCard}
            {MonthStatsCard}
          </div>
        </div>
      </div>
      {dialogs}
    </div>
  )
}

// ───────────────────────────── 하위 컴포넌트 ─────────────────────────────

/** 이름 첫 글자 원형 아바타. */
function Avatar({
  name,
  size = 28,
  dim,
  ring,
}: {
  name: string
  size?: number
  dim?: boolean
  ring?: boolean
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: avatarColor(name),
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: size <= 28 ? 12 : size <= 36 ? 14 : 16,
        flexShrink: 0,
        opacity: dim ? 0.5 : 1,
        border: ring ? '2px solid var(--bg-surface)' : 'none',
        boxSizing: 'border-box',
      }}
    >
      {initial(name)}
    </span>
  )
}

/** 요약 카드 (받을 돈 / 보낼 돈). */
function SummaryCard({
  mobile,
  tone,
  label,
  amount,
  sub,
}: {
  mobile: boolean
  tone: 'receive' | 'send'
  label: string
  amount: number
  sub: string
}) {
  const receive = tone === 'receive'
  const chipVar = receive ? '--color-chart-green' : '--color-chart-orange'
  const fg = receive ? 'var(--status-success-fg)' : 'var(--status-warning-fg)'
  return (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: mobile ? 10 : 12 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: `color-mix(in oklab, var(${chipVar}) 18%, var(--bg-surface))`,
            color: fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {receive ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
        </span>
        <span style={{ fontSize: 12, fontWeight: '600', color: 'var(--fg-tertiary)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <MaskAmount mask="••••">
          <span
            className="num"
            style={{
              fontSize: mobile ? 20 : 24,
              fontWeight: '800',
              letterSpacing: '-0.025em',
              color: fg,
            }}
          >
            {KRW(amount)}
          </span>
        </MaskAmount>
        <HideUnit>
          <span style={{ fontSize: 13, fontWeight: '600', color: fg }}>원</span>
        </HideUnit>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 4 }}>{sub}</div>
    </Card>
  )
}

/** 진행 중 세션 카드. */
function SessionCard({
  d,
  mobile,
  onClick,
}: {
  d: DutchPay
  mobile: boolean
  onClick: () => void
}) {
  const total = d.participants.length
  const paid = paidCountOf(d)
  const per = perPersonOf(d)
  const pct = total > 0 ? (paid / total) * 100 : 0
  const place = d.description?.trim()
  const meta = place ? `${place} · ${kDateMd(d.dutchPayDate)}` : kDateMd(d.dutchPayDate)
  return (
    <Card
      onClick={onClick}
      style={{ padding: mobile ? 18 : 22, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: '-0.015em',
              color: 'var(--fg-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {d.title}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', marginTop: 3 }}>{meta}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'flex-end' }}>
            <MaskAmount mask="••••">
              <span className="num" style={{ fontSize: 17, fontWeight: '800', letterSpacing: '-0.02em' }}>
                {KRW(d.totalAmount)}
              </span>
            </MaskAmount>
            <HideUnit>
              <span style={{ fontSize: 12, fontWeight: '600' }}>원</span>
            </HideUnit>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            1인 <MaskAmount mask="••••">{KRW(per)}</MaskAmount>
            <HideUnit>원</HideUnit>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        {/* 아바타 최대 4개 고정폭(88) — 인원수 무관 진행바 길이 일정. 5+면 3개 + +N */}
        <div style={{ position: 'relative', width: 88, height: 28, flexShrink: 0 }}>
          {(d.participants.length > 4 ? d.participants.slice(0, 3) : d.participants.slice(0, 4)).map((p, i) => (
            <span key={p.rowId} style={{ position: 'absolute', left: i * 20 }}>
              <Avatar name={p.participantName} size={28} dim={!p.isPaid && !isPayer(d, p)} ring />
            </span>
          ))}
          {d.participants.length > 4 && (
            <span
              style={{
                position: 'absolute',
                left: 60,
                width: 28,
                height: 28,
                borderRadius: 999,
                background: 'var(--bg-sunken)',
                border: '2px solid var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: '700',
                color: 'var(--fg-secondary)',
              }}
            >
              +{d.participants.length - 3}
            </span>
          )}
        </div>
        <div
          style={{
            flex: 1,
            height: 6,
            // 게이지 track: 디자인 SoT(--bg-sunken 다크 #15192a)·앱(bgSunken slate950 #1A1F2E)
            // 정합 위해 진한 다크. desk-front --bg-sunken 은 surface-input(연함)으로 잘못
            // alias, 그리고 --bg-page alias 는 없음(=무효 transparent 였음) → 유효 alias
            // --bg-canvas(=--color-bg-page 다크 #1a1f2e)로 더치 track 만 처리.
            background: 'var(--bg-canvas)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              // fg-brand = 다크모드 primary-light swap (앱 fgBrand 정합)
              background: 'var(--fg-brand)',
              borderRadius: 999,
              transition: 'width var(--motion-duration-slow) var(--ease-decel)',
            }}
          />
        </div>
        <span
          className="num"
          style={{ fontSize: 12, fontWeight: '700', color: 'var(--fg-secondary)', flexShrink: 0 }}
        >
          {paid}/{total}
        </span>
      </div>
    </Card>
  )
}

/** 완료 탭 행. */
function PastRow({ d, first, onClick }: { d: DutchPay; first: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        cursor: 'pointer',
        borderTop: first ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in oklab, var(--color-chart-green) 14%, var(--bg-surface))',
          color: 'var(--status-success-fg)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Check size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: 'var(--fg-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {kDateMd(d.dutchPayDate)} · {d.participants.length}명
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
        <MaskAmount mask="••••">
          <span className="num" style={{ fontSize: 14, fontWeight: '700' }}>
            {KRW(d.totalAmount)}
          </span>
        </MaskAmount>
        <HideUnit>
          <span style={{ fontSize: 11.5, fontWeight: '600', color: 'var(--fg-tertiary)' }}>원</span>
        </HideUnit>
      </div>
    </div>
  )
}

/** 친구 탭 행. */
function FriendRow({
  f,
  first,
}: {
  f: { name: string; sessions: number; net: number }
  first: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderTop: first ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <Avatar name={f.name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: '600', color: 'var(--fg-primary)' }}>{f.name}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {f.sessions}회 정산 함께
        </div>
      </div>
      {f.net > 0 ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
          <MaskAmount mask="••••">
            <span className="num" style={{ fontSize: 14, fontWeight: '700', color: 'var(--status-success-fg)' }}>
              +{KRW(f.net)}
            </span>
          </MaskAmount>
          <HideUnit>
            <span style={{ fontSize: 11.5, fontWeight: '600', color: 'var(--status-success-fg)' }}>원</span>
          </HideUnit>
        </div>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', flexShrink: 0 }}>정산 완료</span>
      )}
    </div>
  )
}

/** 데스크톱 우측 통계 row. */
function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{label}</span>
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 14,
          fontWeight: '700',
          color: 'var(--fg-primary)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

/** 빈 상태 (메모/할일 패턴 정합). */
function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--bg-sunken)',
          color: 'var(--fg-tertiary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: '700', color: 'var(--fg-primary)', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>{desc}</div>
    </div>
  )
}

// ───────────────────────── 만들기 2단계 마법사 ─────────────────────────

const MY_NAME = '나'

function DutchCreateWizard({
  mobile,
  today,
  friendNames,
  onClose,
  onCreate,
  submitting,
}: {
  mobile: boolean
  today: string
  friendNames: string[]
  onClose: () => void
  onCreate: (values: DutchPayFormValues) => void
  submitting?: boolean
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [totalStr, setTotalStr] = useState('')
  const [date, setDate] = useState(today)
  const [titleError, setTitleError] = useState(false)

  // 추천 목록 = 기존 정산 이름 빈도 기반(중복 제거). 직접 추가 이름은 extras 에.
  const [extras, setExtras] = useState<string[]>([])
  const [newName, setNewName] = useState('')
  // 선택 상태: '나'는 항상 고정 결제자. picked 에 이름 set.
  const [picked, setPicked] = useState<Set<string>>(() => new Set([MY_NAME]))

  const totalNum = useMemo(() => Number(totalStr.replace(/[^0-9]/g, '')) || 0, [totalStr])

  const candidates = useMemo(() => {
    const seen = new Set<string>([MY_NAME])
    const out: string[] = []
    for (const n of [...friendNames, ...extras]) {
      if (!n.trim() || seen.has(n)) continue
      seen.add(n)
      out.push(n)
    }
    return out
  }, [friendNames, extras])

  const perPerson = picked.size > 0 ? Math.floor(totalNum / picked.size) : 0

  const toggle = (name: string) => {
    if (name === MY_NAME) return // 결제자 고정
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const addName = () => {
    const v = newName.trim()
    if (!v || v === MY_NAME || candidates.includes(v)) {
      setNewName('')
      return
    }
    setExtras(prev => [...prev, v])
    setPicked(prev => new Set(prev).add(v))
    setNewName('')
  }

  const goNext = () => {
    if (!title.trim() || totalNum <= 0) {
      if (!title.trim()) setTitleError(true)
      return
    }
    setStep(2)
  }

  const submit = () => {
    if (picked.size < 2) return
    // EQUAL 분배: floor, 나머지 첫 참여자(나).
    const names = [MY_NAME, ...candidates.filter(n => picked.has(n))]
    const base = Math.floor(totalNum / names.length)
    const remainder = totalNum - base * names.length
    const participants = names.map((name, i) => ({
      userRowId: i === 0 ? undefined : null,
      participantName: name,
      amount: base + (i === 0 ? remainder : 0),
    }))
    onCreate({
      title: title.trim(),
      description: place.trim() || undefined,
      totalAmount: totalNum,
      splitMethod: 'EQUAL',
      dutchPayDate: date,
      participants,
    })
  }

  const Footer =
    step === 1 ? (
      <>
        <Button variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button onClick={goNext} disabled={!title.trim() || totalNum <= 0}>
          다음
        </Button>
      </>
    ) : (
      <>
        <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
          <ChevronLeft size={14} /> 이전
        </Button>
        <Button onClick={submit} disabled={picked.size < 2} loading={submitting}>
          <Check size={14} /> 정산 만들기
        </Button>
      </>
    )

  return (
    <ModalShell
      title={step === 1 ? '정산 만들기 (1/2)' : '참여자 선택 (2/2)'}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      {step === 1 ? (
        <>
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>정산 이름</FieldLabel>
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (titleError) setTitleError(false)
              }}
              placeholder="예: 팀 저녁 회식"
              aria-invalid={titleError}
              autoFocus
            />
            {titleError && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  background: 'var(--status-danger-subtle)',
                  color: 'var(--status-danger-fg)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                }}
              >
                정산 이름을 입력해주세요
              </div>
            )}
          </Field>

          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>장소</FieldLabel>
            <Input
              value={place}
              onChange={e => setPlace(e.target.value)}
              placeholder="장소 또는 상호명 (선택)"
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field>
              <FieldLabel>총 금액</FieldLabel>
              <div style={{ position: 'relative' }}>
                <Input
                  value={totalNum > 0 ? totalNum.toLocaleString('ko-KR') : totalStr}
                  onChange={e => setTotalStr(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  style={{ paddingRight: 28, textAlign: 'right' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    color: 'var(--fg-tertiary)',
                    pointerEvents: 'none',
                  }}
                >
                  원
                </span>
              </div>
            </Field>
            <Field>
              <FieldLabel>날짜</FieldLabel>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </Field>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 13,
              color: 'var(--fg-secondary)',
              marginBottom: 12,
              fontWeight: '600',
            }}
          >
            {picked.size}명 선택 · 1인당{' '}
            <MaskAmount mask="••••">
              <span className="num">{KRW(perPerson)}</span>
            </MaskAmount>
            <HideUnit>원</HideUnit>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <ParticipantPick name={MY_NAME} note="결제자" checked locked onToggle={() => {}} />
            {candidates.map(name => (
              <ParticipantPick
                key={name}
                name={name}
                note={friendNames.includes(name) ? '추천' : undefined}
                checked={picked.has(name)}
                onToggle={() => toggle(name)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addName()
                }
              }}
              placeholder="이름 입력 후 추가"
            />
            <Button variant="outline" onClick={addName} style={{ flexShrink: 0 }}>
              <Plus size={14} /> 추가
            </Button>
          </div>
        </>
      )}
    </ModalShell>
  )
}

/** 참여자 선택 행 (체크). */
function ParticipantPick({
  name,
  note,
  checked,
  locked,
  onToggle,
}: {
  name: string
  note?: string
  checked: boolean
  locked?: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={locked ? undefined : onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        background: checked
          ? 'color-mix(in oklab, var(--color-primary) 6%, var(--bg-surface))'
          : 'transparent',
        cursor: locked ? 'default' : 'pointer',
        transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 'var(--radius-sm)',
          border: checked ? '0' : '2px solid var(--border-strong)',
          background: checked ? 'var(--color-primary)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </span>
      <Avatar name={name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: '600', color: 'var(--fg-primary)' }}>{name}</span>
      </div>
      {note && <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>{note}</span>}
    </div>
  )
}

// ───────────────────────── 상세 모달 ─────────────────────────

function DutchDetailDialog({
  d,
  mobile,
  onClose,
  onMarkPaid,
  onRequest,
  onRequestAll,
  onSettleAll,
  onDelete,
  markPaidPending,
  settleAllPending,
  deleting,
}: {
  d: DutchPay
  mobile: boolean
  onClose: () => void
  onMarkPaid: (dutchPayId: number, participantId: number) => void
  onRequest: (name: string) => void
  onRequestAll: (d: DutchPay) => void
  onSettleAll: (id: number) => void
  onDelete: (id: number) => void
  markPaidPending?: boolean
  settleAllPending?: boolean
  deleting?: boolean
}) {
  const active = isActiveSession(d)
  const per = perPersonOf(d)
  const place = d.description?.trim()
  const meta = place ? `${place} · ${kDateFull(d.dutchPayDate)}` : kDateFull(d.dutchPayDate)

  const Footer = active ? (
    <>
      <Button
        variant="ghost"
        onClick={() => onDelete(d.rowId)}
        style={{ color: 'var(--status-danger-fg)', marginRight: 'auto' }}
        loading={deleting}
      >
        <Trash2 size={14} /> 삭제
      </Button>
      <Button variant="outline" onClick={onClose}>
        닫기
      </Button>
      <Button onClick={() => onRequestAll(d)}>
        <Send size={14} /> 일괄 요청
      </Button>
    </>
  ) : (
    <>
      <Button
        variant="ghost"
        onClick={() => onDelete(d.rowId)}
        style={{ color: 'var(--status-danger-fg)', marginRight: 'auto' }}
        loading={deleting}
      >
        <Trash2 size={14} /> 삭제
      </Button>
      <Button variant="outline" onClick={onClose}>
        닫기
      </Button>
    </>
  )

  return (
    <ModalShell title={d.title} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      {/* hero */}
      <div
        style={{
          background: 'color-mix(in oklab, var(--color-primary) 6%, var(--bg-surface))',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: '600', color: 'var(--fg-tertiary)' }}>{meta}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 6 }}>
          <MaskAmount mask="••••">
            <span
              className="num"
              style={{
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: '-0.03em',
                color: 'var(--color-primary)',
              }}
            >
              {KRW(d.totalAmount)}
            </span>
          </MaskAmount>
          <HideUnit>
            <span style={{ fontSize: 15, fontWeight: '700', color: 'var(--color-primary)' }}>원</span>
          </HideUnit>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-secondary)', marginTop: 4 }}>
          1인당 <MaskAmount mask="••••">{KRW(per)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </div>
      </div>

      {/* 진행 중 = 전체 정산 액션 */}
      {active && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Button
            variant="outline"
            size="sm"
            loading={settleAllPending}
            onClick={() => onSettleAll(d.rowId)}
          >
            전체 정산 완료
          </Button>
        </div>
      )}

      <div
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: 'var(--fg-tertiary)',
          letterSpacing: '0.04em',
          marginBottom: 8,
        }}
      >
        참여자 · {d.participants.length}명
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {d.participants.map(p => {
          const payer = isPayer(d, p)
          const statusText = payer
            ? '결제자'
            : p.isPaid
              ? '정산 완료'
              : null
          return (
            <div key={p.rowId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <Avatar name={p.participantName} size={36} dim={!p.isPaid && !payer} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: '600', color: 'var(--fg-primary)' }}>
                    {p.participantName}
                  </span>
                  {payer && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--bg-brand-subtle)',
                        color: 'var(--fg-brand-strong)',
                      }}
                    >
                      결제자
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                  {statusText ?? (
                    <>
                      <MaskAmount mask="••••">{KRW(p.amount)}</MaskAmount>
                      <HideUnit>원</HideUnit> 송금 필요
                    </>
                  )}
                </div>
              </div>
              {/* 완료 뱃지 / 미정: 요청(UI-only) + 송금완료 처리(체크) */}
              {payer ? null : p.isPaid ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: '700',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--status-success-subtle)',
                    color: 'var(--status-success-fg)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: 'currentColor',
                    }}
                  />
                  완료
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Button variant="outline" size="sm" onClick={() => onRequest(p.participantName)}>
                    요청
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="송금 완료 처리"
                    loading={markPaidPending}
                    onClick={() => onMarkPaid(d.rowId, p.rowId)}
                  >
                    <Check size={16} />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ModalShell>
  )
}

// ───────────────────────────── 로딩 스켈레톤 ─────────────────────────────

function SummaryCardSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: mobile ? 10 : 12 }}>
        <SkeletonBase className="h-7 w-7 rounded-sm shrink-0" />
        <SkeletonBase className="h-3 w-12" />
      </div>
      <SkeletonBase className={mobile ? 'h-6 w-28' : 'h-7 w-32'} />
      <SkeletonBase className="h-3 w-16 mt-2" />
    </Card>
  )
}

function SessionCardSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SkeletonBase className="h-5 w-2/5 mb-2" />
          <SkeletonBase className="h-3.5 w-1/3" />
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <SkeletonBase className="h-5 w-20 mb-1.5" />
          <SkeletonBase className="h-3 w-14 ml-auto" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <SkeletonBase className="h-7 w-20 rounded-full shrink-0" />
        <SkeletonBase className="h-1.5 flex-1 rounded-full" />
        <SkeletonBase className="h-3 w-8 shrink-0" />
      </div>
    </Card>
  )
}

/** DutchPay 페이지 구조 일치 skeleton — 요약 2카드 + 탭 + 세션 카드. */
function DutchPayPageSkeleton({ mobile }: { mobile: boolean }) {
  const Summary = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mobile ? 8 : 12 }}>
      <SummaryCardSkeleton mobile={mobile} />
      <SummaryCardSkeleton mobile={mobile} />
    </div>
  )
  const TabsSk = <SkeletonBase className="h-9 w-56 rounded-[var(--radius-md)]" />
  const Cards = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 10 : 12 }}>
      <SessionCardSkeleton mobile={mobile} />
      <SessionCardSkeleton mobile={mobile} />
    </div>
  )

  if (mobile) {
    return (
      <>
        <MobileBackHeader title="더치페이" />
        <div style={{ padding: '16px 16px 96px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Summary}
            {TabsSk}
            {Cards}
          </div>
        </div>
      </>
    )
  }
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <SkeletonBase className="h-8 w-24 mb-2" />
          <SkeletonBase className="h-4 w-40" />
        </div>
        <div className="right">
          <SkeletonBase className="h-8 w-28 rounded-md" />
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Summary}
            {TabsSk}
            {Cards}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonBase className="h-48 w-full rounded-[var(--radius-lg)]" />
            <SkeletonBase className="h-40 w-full rounded-[var(--radius-lg)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
