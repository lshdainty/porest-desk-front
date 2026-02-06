import { useTranslation } from 'react-i18next'
import { CalendarViewWidget } from '@/widgets/calendar-view'

export const CalendarPage = () => {
  const { t } = useTranslation('calendar')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <CalendarViewWidget />
    </div>
  )
}
