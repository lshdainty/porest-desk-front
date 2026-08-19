import { useState } from 'react'
import { Pencil, Pin, Trash2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { SwipeActions, type SwipeAction } from '@/shared/ui/swipe-actions'
import {
  LedgerRow,
  LedgerRowMain,
  LedgerRowSub,
  LedgerRowTitle,
} from '@/shared/ui/porest/ledger'
import { Button } from '@/shared/ui/button'
import { useTheme } from '@/shared/ui/theme-provider'

/**
 * SwipeActions 실기기 확인용 랩 — **DEV 전용**(`/desk/__swipe-lab`).
 *
 * <p>이 레포에는 브라우저 자동화도 테스트 러너도 없다. 기하는 순수 함수로 빼 node 로
 * 확인했지만 제스처 손맛·다크 대비는 손가락으로 봐야 안다. 화면 배선(가계부·할일·메모)
 * 전에 컴포넌트만 따로 만져 볼 자리를 둔다.
 *
 * <p>배선이 끝나면 지운다 — 라우트도 이 파일도 남기지 않는다.
 */
export function SwipeLabPage() {
  const { mobile } = useOutletContext<{ mobile: boolean }>()
  const { theme, setTheme } = useTheme()
  const [log, setLog] = useState<string[]>([])

  const push = (line: string) => setLog(prev => [line, ...prev].slice(0, 6))

  const edit = (name: string): SwipeAction => ({
    label: '수정',
    icon: <Pencil />,
    kind: 'primary',
    onSelect: () => push(`수정 · ${name}`),
  })

  const remove = (name: string): SwipeAction => ({
    label: '삭제',
    icon: <Trash2 />,
    kind: 'destructive',
    confirm: {
      title: '삭제할까요?',
      message: `"${name}" 을(를) 지웁니다. 되돌릴 수 없어요.`,
      confirmLabel: '삭제',
    },
    // 실제 뮤테이션처럼 잠깐 걸리게 — 확인 버튼 스피너가 도는지 본다.
    onSelect: () =>
      new Promise(resolve => setTimeout(resolve, 700)).then(() => push(`삭제 · ${name}`)),
  })

  const pin = (name: string): SwipeAction => ({
    label: '고정',
    icon: <Pin />,
    kind: 'neutral',
    onSelect: () => push(`고정 · ${name}`),
  })

  const row = (
    name: string,
    sub: string,
    actions: SwipeAction[],
    group = 'lab',
  ) => (
    <SwipeActions
      key={`${group}-${name}`}
      rowId={`${group}-${name}`}
      groupTag={group}
      rowLabel={name}
      actions={actions}
      enabled={mobile}
    >
      <LedgerRow onClick={() => push(`행 탭 · ${name}`)}>
        <LedgerRowMain as="button">
          <LedgerRowTitle>{name}</LedgerRowTitle>
          <LedgerRowSub>
            <span>{sub}</span>
          </LedgerRowSub>
        </LedgerRowMain>
      </LedgerRow>
    </SwipeActions>
  )

  return (
    <div className="px-[var(--spacing-xl)] py-[var(--spacing-lg)] flex flex-col gap-[var(--spacing-xl)]">
      <div className="flex items-center gap-2">
        <h1 className="text-[length:var(--text-title-md)] font-semibold flex-1">
          Swipe Lab
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '라이트로' : '다크로'}
        </Button>
      </div>

      {!mobile && (
        <p className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">
          데스크톱 뷰포트다 — spec Platform 대로 트레이가 없다(행만 렌더). 768 미만으로
          줄이면 스와이프가 붙는다.
        </p>
      )}

      <Section title="액션 1개 (트레이 56)">
        {row('문자 한 통', '삭제만 있는 경우', [remove('문자 한 통')])}
      </Section>

      <Section title="액션 2개 (트레이 104)">
        {row('스타벅스', '카페 · 5,600원', [edit('스타벅스'), remove('스타벅스')])}
        {row('이마트', '장보기 · 42,100원', [edit('이마트'), remove('이마트')])}
      </Section>

      <Section title="액션 3개 (트레이 152) · 긴 라벨 · disabled">
        {row('장보기 목록', '고정·수정·삭제', [
          pin('장보기 목록'),
          edit('장보기 목록'),
          remove('장보기 목록'),
        ])}
        {row('고정 해제 라벨', '4글자 라벨이 슬롯을 넘치는지', [
          { label: '고정 해제', icon: <Pin />, kind: 'neutral', onSelect: () => push('고정 해제') },
          edit('고정 해제 라벨'),
          remove('고정 해제 라벨'),
        ])}
        {row('비활성 액션', 'disabled 시각', [
          { label: '고정', icon: <Pin />, kind: 'neutral', disabled: true, onSelect: () => {} },
          remove('비활성 액션'),
        ])}
      </Section>

      <Section title="다른 그룹 (서로 닫지 않아야 한다)">
        {row('다른 리스트 A', 'groupTag=lab-2', [remove('다른 리스트 A')], 'lab-2')}
        {row('다른 리스트 B', 'groupTag=lab-2', [remove('다른 리스트 B')], 'lab-2')}
      </Section>

      <Section title="스크롤 확인 — 20행">
        {Array.from({ length: 20 }, (_, i) =>
          row(`행 ${i + 1}`, '열어 둔 채 스크롤하면 닫혀야 한다', [
            edit(`행 ${i + 1}`),
            remove(`행 ${i + 1}`),
          ]),
        )}
      </Section>

      <div className="sticky bottom-0 bg-[var(--bg-surface)] pt-2 pb-[var(--spacing-lg)]">
        <div className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)] mb-1">
          최근 동작
        </div>
        {log.length === 0 ? (
          <div className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">
            아직 없음
          </div>
        ) : (
          log.map((line, i) => (
            <div
              key={`${line}-${i}`}
              className="text-[length:var(--text-caption)] text-[var(--fg-secondary)] tabular-nums"
            >
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <div className="text-[length:var(--text-label-sm)] font-semibold text-[var(--fg-tertiary)] uppercase tracking-[0.04em] pb-1">
        {title}
      </div>
      {children}
    </section>
  )
}
