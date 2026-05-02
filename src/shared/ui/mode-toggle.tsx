import { Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useTheme } from '@/shared/ui/theme-provider'

/**
 * shadcn dark-mode 패턴 (https://ui.shadcn.com/docs/dark-mode/vite) 기반.
 * TopBar 아이콘 버튼과 시각 통일을 위해 `.top__icon-btn` 클래스 사용.
 * Light / Dark / System 3가지 옵션.
 */
export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="top__icon-btn" aria-label="테마 전환" title="테마 전환">
          {resolvedTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} data-active={theme === 'light'}>
          <Sun className="mr-2 h-4 w-4" />
          라이트
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} data-active={theme === 'dark'}>
          <Moon className="mr-2 h-4 w-4" />
          다크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} data-active={theme === 'system'}>
          <Monitor className="mr-2 h-4 w-4" />
          시스템
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
