import { useTranslation } from 'react-i18next'
import { MemoEditorWidget } from '@/widgets/memo-editor'

export const MemoPage = () => {
  const { t } = useTranslation('memo')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <MemoEditorWidget />
    </div>
  )
}
