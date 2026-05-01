import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  CalendarDays,
  ChartPie,
  ChevronRight,
  Home,
  ListChecks,
  NotebookPen,
  Receipt,
  Settings,
  Target,
  UsersRound,
  Wallet,
} from 'lucide-react'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

interface NavItem {
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  path: string
  desc: string
}

const ITEMS: NavItem[] = [
  { label: '홈', icon: Home, path: '/desk', desc: '순자산과 오늘 지출 요약' },
  { label: '자산', icon: Wallet, path: '/desk/asset', desc: '계좌·카드·투자' },
  { label: '가계부', icon: Receipt, path: '/desk/expense', desc: '모든 거래 내역' },
  { label: '통계·분석', icon: ChartPie, path: '/desk/stats', desc: '카테고리·추이·비교' },
  { label: '예산', icon: Target, path: '/desk/budget', desc: '카테고리별 한도 관리' },
  { label: '캘린더', icon: CalendarDays, path: '/desk/calendar', desc: '일별 수입·지출' },
  { label: '할 일', icon: ListChecks, path: '/desk/todo', desc: '할 일과 작업 관리' },
  { label: '더치페이', icon: UsersRound, path: '/desk/dutch-pay', desc: '함께 쓴 돈 정산' },
  { label: '메모', icon: NotebookPen, path: '/desk/memo', desc: '간단 메모' },
  { label: '설정', icon: Settings, path: '/desk/settings', desc: '카테고리·계정 등' },
]

export const MorePage = () => {
  const navigate = useNavigate()
  useOutletContext<OutletCtx>()

  return (
    <div style={{ padding: '4px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>더보기</h2>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>모든 메뉴를 한 곳에서</div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          padding: '0 12px',
        }}
      >
        {ITEMS.map(item => {
          const IconComp = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 10,
                padding: '18px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand-strong)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComp size={19} strokeWidth={1.9} />
              </span>
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--fg-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                  <ChevronRight size={14} style={{ color: 'var(--fg-tertiary)', marginLeft: 'auto' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 4, lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
