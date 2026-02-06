import { useTranslation } from 'react-i18next'

export const LayoutHeader = () => {
  const { t } = useTranslation('common')

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('app.title')}</span>
      </div>
    </header>
  )
}
