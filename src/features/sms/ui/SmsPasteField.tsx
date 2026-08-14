import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardPaste } from 'lucide-react'
import { Alert, AlertBody, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { parseSms, type SmsParseResult } from '@/features/sms/api/smsApi'
import { looksLikePaymentSms } from '@/features/sms/model/smsPrefilter'

type Props = {
  /** 해석에 성공했을 때 — 원문과 결과를 함께 넘긴다(저장 때 원문이 다시 필요하다). */
  onParsed: (text: string, parsed: SmsParseResult) => void
}

/**
 * 결제 문자를 붙여넣어 폼을 채우는 입력.
 *
 * 문자를 손으로 옮겨 적는 대신 통째로 붙여넣으면 금액·가맹점·일시·카드가 채워진다.
 * 앱(iOS 클립보드 배너·안드로이드 수신 알림)과 같은 서버 파서를 쓰므로 결과가 같다.
 *
 * 서버로 보내기 전에 로컬 프리필터를 한 번 거친다 — 정확도가 아니라 프라이버시가
 * 목적이다. 사용자가 실수로 붙여넣은 아무 텍스트가 서버로 올라가면 안 된다.
 */
export function SmsPasteField({ onParsed }: Props) {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    const value = text.trim()
    if (!value || loading) return

    if (!looksLikePaymentSms(value)) {
      setNotice(t('sms.notRecognized'))
      return
    }
    setLoading(true)
    setNotice(null)
    try {
      const parsed = await parseSms(value)
      if (!parsed.matched) {
        setNotice(t('sms.notRecognized'))
        return
      }
      // 취소 문자는 원 거래를 특정할 수 없어 자동 기록하지 않는다 —
      // 그냥 지출로 넣으면 결제와 취소가 둘 다 지출로 쌓여 두 배가 된다.
      if (parsed.cancel) {
        setNotice(t('sms.cancelNotice'))
        return
      }
      if (parsed.confidence === 'LOW') {
        setNotice(t('sms.lowConfidence'))
      }
      onParsed(value, parsed)
      setOpen(false)
      setText('')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : t('sms.parseFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        style={{ marginBottom: 18, width: '100%' }}
      >
        <ClipboardPaste size={14} />
        {t('sms.pasteOpen')}
      </Button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('sms.pastePlaceholder')}
        rows={5}
        autoFocus
      />
      {notice && (
        <Alert variant="warning">
          <AlertBody>
            <AlertDescription>{notice}</AlertDescription>
          </AlertBody>
        </Alert>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="button" size="sm" onClick={run} disabled={loading || !text.trim()}>
          {loading ? t('sms.parsing') : t('sms.pasteAction')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false)
            setNotice(null)
          }}
        >
          {tc('cancel')}
        </Button>
      </div>
    </div>
  )
}
