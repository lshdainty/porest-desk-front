import { useTranslation } from 'react-i18next'
import { TimerFullWidget } from '@/widgets/timer-full'

export const TimerPage = () => {
  const { t } = useTranslation('timer')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <TimerFullWidget />
    </div>
  )
}
