import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/index'

/*
 * Porest Fab — 화면 우하단 플로팅 액션 버튼 공용화 (shadcn 패턴).
 *
 * 52px 완전 원형 · bg-brand 채움(다크 동일) · shadow-lg · bottom 24 / right 18
 * (풀스크린 페이지 기준 — 탭바 있는 화면은 className으로 bottom 오버라이드).
 * children 없으면 기본 Plus(22/2.5) 아이콘. 앱 PFloatingActionButton 미러.
 */
export function Fab({ className, children, type = 'button', ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'fixed bottom-6 right-[18px] z-20 w-[52px] h-[52px] rounded-full border-0',
        'bg-[var(--bg-brand)] text-[var(--fg-on-brand)] shadow-[var(--shadow-lg)]',
        'inline-flex items-center justify-center cursor-pointer',
        'transition-transform duration-[var(--motion-duration-fast)] active:scale-95',
        className,
      )}
      {...props}
    >
      {children ?? <Plus size={22} strokeWidth={2.5} />}
    </button>
  )
}
