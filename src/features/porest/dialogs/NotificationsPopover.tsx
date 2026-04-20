import { useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  CreditCard,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'

type Tone = 'warn' | 'brand' | 'good' | 'warm' | 'mist'

interface Notif {
  id: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  tone: Tone
  title: string
  desc: string
  time: string
  unread: boolean
}

const INITIAL: Notif[] = [
  { id: 'n1', Icon: AlertTriangle, tone: 'warn',  title: '식비 예산 90% 사용', desc: '이번 달 식비 예산의 90%를 사용했어요.', time: '방금', unread: true },
  { id: 'n2', Icon: CreditCard,    tone: 'brand', title: '신한 Deep Dream 결제 D-8', desc: '842,500원 결제 예정', time: '1시간 전', unread: true },
  { id: 'n3', Icon: Zap,           tone: 'brand', title: 'KT 통신요금 결제 완료', desc: '−42,000원 · 신한 주거래', time: '어제', unread: true },
  { id: 'n4', Icon: RefreshCw,     tone: 'mist',  title: '계좌 동기화 완료', desc: '4개 계좌, 2개 카드 업데이트됨', time: '어제', unread: false },
  { id: 'n5', Icon: Sparkles,      tone: 'warm',  title: '이번 주 카페 지출이 늘었어요', desc: '스타벅스 5회 · 32,400원', time: '2일 전', unread: false },
  { id: 'n6', Icon: TrendingUp,    tone: 'good',  title: '급여 입금 확인', desc: '+3,820,000원 · 신한 주거래', time: '4일 전', unread: false },
]

function toneStyle(t: Tone): { bg: string; fg: string } {
  switch (t) {
    case 'warn':  return { bg: 'var(--sunlit-100)', fg: 'var(--sunlit-700)' }
    case 'brand': return { bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)' }
    case 'good':  return { bg: 'var(--mossy-100)', fg: 'var(--mossy-800)' }
    case 'warm':  return { bg: 'var(--bark-100)', fg: 'var(--bark-700)' }
    default:      return { bg: 'var(--mist-200)', fg: 'var(--fg-secondary)' }
  }
}

export function NotificationsPopover({
  onClose,
  onGoSettings,
}: {
  onClose: () => void
  onGoSettings?: () => void
}) {
  const [items, setItems] = useState<Notif[]>(INITIAL)
  const unreadCount = items.filter(n => n.unread).length
  const markAllRead = () => setItems(items.map(n => ({ ...n, unread: false })))

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-pop" role="dialog" aria-label="알림">
        <div className="notif-pop__head">
          <div>
            <div className="notif-pop__title">알림</div>
            {unreadCount > 0 && (
              <div className="notif-pop__sub">
                읽지 않은 알림 <b>{unreadCount}</b>개
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="notif-pop__read-all" onClick={markAllRead}>
              모두 읽음
            </button>
          )}
        </div>
        <div className="notif-pop__body">
          {items.map(n => {
            const s = toneStyle(n.tone)
            const IconComp = n.Icon
            return (
              <div
                key={n.id}
                className={`notif-row ${n.unread ? 'unread' : ''}`}
                onClick={() => setItems(items.map(x => (x.id === n.id ? { ...x, unread: false } : x)))}
              >
                <span className="notif-row__icon" style={{ background: s.bg, color: s.fg }}>
                  <IconComp size={16} strokeWidth={1.9} />
                </span>
                <div className="notif-row__text">
                  <div className="notif-row__title">
                    {n.title}
                    {n.unread && <span className="notif-row__dot" />}
                  </div>
                  <div className="notif-row__desc">{n.desc}</div>
                </div>
                <div className="notif-row__time">{n.time}</div>
              </div>
            )
          })}
        </div>
        <div className="notif-pop__foot">
          <button
            className="notif-pop__all"
            onClick={() => {
              onClose()
              onGoSettings?.()
            }}
          >
            알림 설정 <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </>
  )
}
