import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useTheme } from '@/shared/ui/theme-provider'

/**
 * shadcn dark-mode 패턴 (https://ui.shadcn.com/docs/dark-mode/vite) 기반.
 * TopBar 아이콘 버튼과 시각 통일을 위해 Button variant=ghost size=icon 사용.
 * Light / Dark / System 3가지 옵션.
 */
export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation('common')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('themeToggle')} title={t('themeToggle')}>
          {resolvedTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} data-active={theme === 'light'}>
          <Sun className="mr-2 h-4 w-4" />
          {t('themeLight')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} data-active={theme === 'dark'}>
          <Moon className="mr-2 h-4 w-4" />
          {t('themeDark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} data-active={theme === 'system'}>
          <Monitor className="mr-2 h-4 w-4" />
          {t('themeSystem')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
