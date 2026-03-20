import { QueryProvider } from './providers'
import { AppRouter } from './router'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/shared/ui/theme-provider'
import { EnvWatermark } from '@/shared/ui/env-watermark'
import '@/shared/i18n'

export const AppRoot = () => {
  return (
    <ThemeProvider>
      <EnvWatermark />
      <QueryProvider>
        <Toaster position="top-center" richColors />
        <AppRouter />
      </QueryProvider>
    </ThemeProvider>
  )
}
