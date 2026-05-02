import { useEffect, useRef, useState } from 'react'
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
        setError(e.message || '비밀번호가 일치하지 않습니다.')
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
            금액 보기 인증
          </DialogTitle>
          <DialogClose
            aria-label="닫기"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-secondary)] hover:bg-[var(--pd-hover-bg)] hover:text-[var(--fg-primary)]"
          >
            ✕
          </DialogClose>
        </DialogHeader>
        <DialogBody>
          <p className="mb-4 text-[13.5px] leading-6 text-[var(--fg-secondary)]">
            금액을 다시 보려면 비밀번호로 본인 확인이 필요해요.
          </p>
          <Field>
            <FieldLabel htmlFor="hide-unlock-pw">비밀번호</FieldLabel>
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
              placeholder="비밀번호 입력"
              aria-invalid={!!error || undefined}
            />
            {error && (
              <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            loading={verifyMut.isPending}
            disabled={!password.trim()}
            onClick={submit}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
