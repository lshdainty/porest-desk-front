import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, KeyRound, Lock, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useChangePasswordMutation } from '@/features/user'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Form } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useIsMobile } from '@/shared/hooks'
import { PASSWORD_RULES, isPasswordValid } from '@/shared/lib'

interface PasswordChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    currentPassword: z.string().min(1, t('currentPasswordRequired')),
    // 정책(8자 이상·특수문자)은 PASSWORD_RULES 단일 소스 — 체크리스트가 이미 미달 항목을
    // 짚어주므로 필드 에러는 한 줄로만 남긴다.
    newPassword: z
      .string()
      .min(1, t('newPasswordRequired'))
      .refine(isPasswordValid, { message: t('passwordPolicyUnmet') }),
    confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
  })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    })
    // 서버(SSO)도 현재와 동일한 비밀번호를 거부한다 — 제출 전에 걸러 왕복을 줄인다.
    .refine((data) => !data.currentPassword || data.newPassword !== data.currentPassword, {
      message: t('passwordSameAsCurrent'),
      path: ['newPassword'],
    })

/**
 * 입력 중 규칙 충족 여부 체크리스트.
 * 값이 비어 있으면 표시하지 않는다(입력 전 경고로 겁주지 않게).
 * 이 레포에서 비밀번호를 새로 만드는 화면은 여기뿐이라 다이얼로그 로컬로 둔다.
 */
const PasswordRules = ({ password, t }: { password: string; t: (key: string) => string }) => {
  if (!password) return null

  return (
    <ul className="grid gap-1 pt-0.5" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        const Icon = ok ? Check : X
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 text-xs ${
              ok ? 'text-[var(--status-success-fg)]' : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{t(rule.key)}</span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * 확인 입력이 새 비밀번호와 같은지 실시간 표시.
 * 확인 입력이 비어 있으면 표시하지 않는다(입력 시작 전부터 불일치로 겁주지 않게).
 * 불일치는 규칙 미달(아직 채우는 중)과 달리 두 값이 어긋난 '충돌'이라
 * 위 체크리스트의 muted 대신 destructive 로 분명하게 보여준다.
 */
const PasswordMatch = ({
  password,
  confirmPassword,
  t,
}: {
  password: string
  confirmPassword: string
  t: (key: string) => string
}) => {
  if (!confirmPassword) return null

  const matched = password === confirmPassword
  const Icon = matched ? Check : X

  return (
    <p
      className={`flex items-center gap-1.5 text-xs ${
        matched ? 'text-[var(--status-success-fg)]' : 'text-destructive'
      }`}
      aria-live="polite"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{matched ? t('passwordMatched') : t('passwordMismatch')}</span>
    </p>
  )
}

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

  // 체크리스트·일치 표시용 — 입력할 때마다 갱신
  const newPassword = useWatch({ control: form.control, name: 'newPassword' }) ?? ''
  const confirmPassword = useWatch({ control: form.control, name: 'confirmPassword' }) ?? ''

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
          toast.success(t('passwordChangeSuccess'), { id: 'password-change-success' })
          onOpenChange(false)
        },
        // onError: 전역 axios 인터셉터(base.ts)가 server message를 toast.error로 노출 — 중복 방지로 로컬 onError 제거
      }
    )
  }

  if (!open) return null

  const Footer = (
    <ModalFooter
      onCancel={() => onOpenChange(false)}
      cancelLabel={tc('cancel')}
      onSave={form.handleSubmit(onSubmit)}
      saveLabel={tc('save')}
      saving={changePasswordMutation.isPending}
    />
  )

  return (
    <ModalShell
      title={t('passwordChange')}
      onClose={() => onOpenChange(false)}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
      <Form {...form}>
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
            {/* 입력 중 실시간 규칙 표시 — 저장 누르기 전에 미달 조건을 알 수 있게 */}
            <PasswordRules password={newPassword} t={t} />
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
            {/* 불일치는 아래 PasswordMatch 가 입력 중에 이미 보여주므로, 여기선 미입력 에러만 남긴다 */}
            {form.formState.errors.confirmPassword && !confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
            {/* 입력 중 실시간 일치 표시 — 저장 누르기 전에 알 수 있게 */}
            <PasswordMatch password={newPassword} confirmPassword={confirmPassword} t={t} />
          </div>
        </div>
        </form>
      </Form>
    </ModalShell>
  )
}
