import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { useVerifyPasswordMutation } from '@/features/user'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}

export function HideAmountsUnlockDialog({ open, onOpenChange, onVerified }: Props) {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const verifyMut = useVerifyPasswordMutation()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setPassword('')
      setError(null)
      verifyMut.reset()
      return
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const submit = () => {
    if (!password.trim() || verifyMut.isPending) return
    setError(null)
    verifyMut.mutate(password, {
      onSuccess: () => {
        onVerified()
        onOpenChange(false)
      },
      onError: (e) => {
        setError(e.message || t('hideAmounts.passwordError'))
        setPassword('')
        inputRef.current?.focus()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--fg-brand-strong)]" />
            {t('hideAmounts.unlockTitle')}
          </DialogTitle>
          <DialogClose
            aria-label={tc('close')}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)]"
          >
            ✕
          </DialogClose>
        </DialogHeader>
        <DialogBody>
          <p className="mb-4 text-[13.5px] leading-6 text-[var(--fg-secondary)]">
            {t('hideAmounts.unlockDesc')}
          </p>
          <Field>
            <FieldLabel htmlFor="hide-unlock-pw">{t('hideAmounts.password')}</FieldLabel>
            <Input
              id="hide-unlock-pw"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={t('hideAmounts.passwordPlaceholder')}
              aria-invalid={!!error || undefined}
            />
            {error && (
              <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button
            loading={verifyMut.isPending}
            disabled={!password.trim()}
            onClick={submit}
          >
            {tc('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
