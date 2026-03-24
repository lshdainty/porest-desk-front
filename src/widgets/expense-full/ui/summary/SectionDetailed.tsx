import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { PaymentMethodChart } from './PaymentMethodChart'
import { MerchantAnalysisChart } from './MerchantAnalysisChart'
import { AssetUsageChart } from './AssetUsageChart'
import type { Expense, MerchantSummary, AssetExpenseSummary } from '@/entities/expense'

interface SectionDetailedProps {
  expenses: Expense[]
  merchants: MerchantSummary[]
  assets: AssetExpenseSummary[]
}

export const SectionDetailed = ({ expenses, merchants, assets }: SectionDetailedProps) => {
  const { t } = useTranslation('expense')

  return (
    <div className="rounded-xl border p-5">
      <Tabs defaultValue="payment">
        <TabsList>
          <TabsTrigger value="payment">{t('stats.paymentMethod')}</TabsTrigger>
          <TabsTrigger value="merchant">{t('stats.merchantAnalysis')}</TabsTrigger>
          <TabsTrigger value="asset">{t('stats.assetUsage')}</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-4">
          <PaymentMethodChart expenses={expenses} />
        </TabsContent>
        <TabsContent value="merchant" className="mt-4">
          <MerchantAnalysisChart merchants={merchants} />
        </TabsContent>
        <TabsContent value="asset" className="mt-4">
          <AssetUsageChart assets={assets} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
