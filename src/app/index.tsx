import { QueryProvider } from './providers'
import { AppRouter } from './router'
import { Toaster } from 'sonner'
import '@/shared/i18n'

export const AppRoot = () => {
  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
      <AppRouter />
    </QueryProvider>
  )
}
