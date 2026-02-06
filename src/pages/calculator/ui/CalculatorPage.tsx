import { useTranslation } from 'react-i18next'
import { CalculatorFullWidget } from '@/widgets/calculator-full'

export const CalculatorPage = () => {
  const { t } = useTranslation('calculator')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <CalculatorFullWidget />
    </div>
  )
}
