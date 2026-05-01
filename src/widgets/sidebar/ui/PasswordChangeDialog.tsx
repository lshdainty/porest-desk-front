import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useChangePasswordMutation } from '@/features/user'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useIsMobile } from '@/shared/hooks'

interface PasswordChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    currentPassword: z.string().min(1, t('currentPasswordRequired')),
    newPassword: z.string().min(1, t('newPasswordRequired')),
    confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('passwordMismatch'),
    path: ['confirmPassword'],
  })

type PasswordChangeFormValues = z.infer<ReturnType<typeof createFormSchema>>

export const PasswordChangeDialog = ({ open, onOpenChange }: PasswordChangeDialogProps) => {
  const { t } = useTranslation('user')
  const { t: tc } = useTranslation('common')
  const changePasswordMutation = useChangePasswordMutation()
  const isMobile = useIsMobile()

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [open, form])

  const onSubmit = (values: PasswordChangeFormValues) => {
    changePasswordMutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success(t('passwordChangeSuccess'))
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || t('passwordChangeError'))
        },
      }
    )
  }

  if (!open) return null

  const Footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={changePasswordMutation.isPending}
      >
        {tc('cancel')}
      </Button>
      <Button
        type="button"
        onClick={form.handleSubmit(onSubmit)}
        disabled={changePasswordMutation.isPending}
      >
        {changePasswordMutation.isPending ? tc('loading') : tc('save')}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={t('passwordChange')}
      onClose={() => onOpenChange(false)}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <p className="text-sm text-muted-foreground mb-4">{t('passwordChangeDescription')}</p>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="currentPassword" className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {t('currentPassword')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder={t('currentPasswordPlaceholder')}
              {...form.register('currentPassword')}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="newPassword" className="flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              {t('newPassword')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder={t('newPasswordPlaceholder')}
              {...form.register('newPassword')}
            />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword" className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              {t('confirmPassword')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('confirmPasswordPlaceholder')}
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
