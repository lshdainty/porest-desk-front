import { useTranslation } from 'react-i18next'
import { ExpenseFullWidget } from '@/widgets/expense-full'

export const ExpensePage = () => {
  const { t } = useTranslation('expense')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <ExpenseFullWidget />
    </div>
  )
}
