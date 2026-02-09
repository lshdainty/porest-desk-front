import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/features/user'

export const GreetingSection = () => {
  const { t } = useTranslation('dashboard')
  const { data: user } = useCurrentUser()

  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'greeting.morning' : hour < 18 ? 'greeting.afternoon' : 'greeting.evening'

  const today = new Date()
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">
        {t(greetingKey)}, {user?.userName ?? ''}
      </h1>
      <p className="text-sm text-muted-foreground">
        {dateStr} &middot; {t('greeting.subtitle')}
      </p>
    </div>
  )
}
