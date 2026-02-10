import { useTranslation } from 'react-i18next'
import { DutchPayFullWidget } from '@/widgets/dutch-pay-full'

export const DutchPayPage = () => {
  const { t } = useTranslation('dutchPay')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <DutchPayFullWidget />
    </div>
  )
}
