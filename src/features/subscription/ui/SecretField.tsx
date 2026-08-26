import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'

/**
 * 자격증명 한 칸 — 기본은 가려져 있고 눈 아이콘으로 잠깐 벗겨 본다.
 *
 * **API Key 도 Secret 과 같은 자격증명의 반쪽이다.** 한동안 Key 만 평문이라
 * 어깨너머로 읽혔다. 두 칸이 같은 컴포넌트를 쓰면 한쪽만 다시 벗겨지는 일이 안 생긴다.
 *
 * 라벨은 **서버가 준다**(`connection.keyLabel` / `secretLabel`) — 토스는 "Client ID",
 * 나무는 "App Key". 그래서 여기에 이름을 박지 않고 받는다.
 *
 * 토글이 있어야 하는 이유: 붙여넣은 값이 맞는지 확인할 방법이 없으면 연동이 실패해도
 * 원인을 못 찾는다. 기본은 가린 상태고 벗겨 보는 건 사용자 의지다.
 */
export function SecretField({
  label,
  value,
  onChange,
  toggleAriaLabel,
}: {
  /** 서버가 준 라벨. 라벨이자 placeholder 다. */
  label: string
  value: string
  onChange: (v: string) => void
  /** 칸이 둘이라 토글 이름도 달라야 스크린리더가 구분한다. */
  toggleAriaLabel: string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ position: 'relative' }}>
        <Input
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={label}
          // 브라우저·확장에 자격증명이 남지 않게 — 붙여넣기는 그대로 둔다.
          autoComplete="off"
          spellCheck={false}
          className="w-full"
          style={{ paddingRight: 40 }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setRevealed(v => !v)}
          aria-label={toggleAriaLabel}
          aria-pressed={revealed}
          style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', height: 32, width: 32 }}
        >
          {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
    </Field>
  )
}
