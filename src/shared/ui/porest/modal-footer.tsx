import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { useDeviceSize } from '@/shared/lib/porest/responsive'

/**
 * 표준 모달/시트 footer — 좌측 삭제(opt) / 우측 취소 + 저장. 앱 `PSheetFooter` 미러.
 *
 * **액션은 2개까지**(spec drawer.md 액션 구성) — 편집 폼은 `취소`·`저장` 이고 삭제를 두지
 * 않는다(삭제는 상세에서). 좌측 보조 액션이 있는 화면은 `취소` 를 빼 우상단 X 에 맡긴다.
 *
 * 웹은 ModalShell 이 footer 를 ReactNode prop 으로 받을 뿐 표준 footer 위젯이 없어
 * 각 다이얼로그가 동일 JSX(삭제 flush-left danger / 취소 ghost / 저장 primary)를 손으로
 * 복붙해 drift(flush 누락·아이콘 크기·variant 불일치)가 반복됐다. 이 컴포넌트로 수렴.
 *
 * 버튼 스펙은 button.md SoT 정합 — 삭제는 ghost+flush="left"+danger 색, 취소 ghost,
 * 저장 primary(default).
 *
 * **모바일에선 size="lg"(48)** — dialog.md/drawer.md 가 규정하는 한 손 조작 폭. 데스크탑은 md(40).
 * 폭 배분은 ModalShell 이 맡는다(모바일 `[&>button]:flex-1` 균등분배 / 데스크탑 `justify-end`).
 * 삭제만 `flex:none` 으로 균등분배에서 빠져 좌측에 붙는다 — spec drawer.md "액션 2개까지,
 * 삭제는 최좌측 flush-left 로 분리".
 *
 * leftSlot(필터 초기화·요약 텍스트 등 삭제가 아닌 좌측 요소)·saveIcon(내보내기/전송)
 * 같은 변형도 지원. 뷰(읽기전용) footer·위저드는 범위 밖(별도 패턴).
 */
type ModalFooterProps = {
  /** 저장(주 액션) 핸들러 + 라벨. */
  onSave: () => void
  saveLabel: string
  /**
   * 주 액션 버튼 variant — 기본 `default`(primary). `destructive` 는 파괴적 주액션
   * (구독 해지 등)을 우측 솔리드 danger 버튼으로(앱 PButton danger 정합). button.md SoT.
   */
  saveVariant?: 'default' | 'destructive'
  /**
   * 반반(50/50) 풀폭 footer — 취소(outline)+저장 둘 다 `flex:1` 로 동일 폭. 앱 `PSheetFooter`
   * (Expanded 2개) 정합. 기본(false) 은 우측 정렬 compact(ghost 취소). leftSlot/onDelete 와
   * 동시 사용하지 말 것.
   */
  fullWidth?: boolean
  /** 저장 진행 중 — spinner + 비활성. */
  saving?: boolean
  /** 저장 불가(폼 미충족 등). */
  saveDisabled?: boolean
  /** 저장 라벨 앞 아이콘 (내보내기 Download / 전송 Send 등). */
  saveIcon?: ReactNode
  /**
   * 취소/닫기 핸들러 — **없으면 버튼 자체를 렌더하지 않는다**. 액션이 3개가 될 때
   * (필터 `초기화`·분할 `분할 해제` 처럼 좌측 액션이 이미 있을 때) 취소를 빼고 우상단 X 에
   * 맡긴다(spec drawer.md 액션 구성).
   */
  onCancel?: () => void
  cancelLabel?: string
  /** 좌측 삭제(파괴적) — 제공 시에만 렌더. flush-left + danger 색. */
  onDelete?: () => void
  deleteLabel?: string
  deleting?: boolean
  /**
   * 삭제 대신 좌측에 둘 임의 요소(필터 '초기화' 버튼, '1인당 N원' 요약 텍스트 등).
   * onDelete 와 동시 사용하지 말 것.
   */
  leftSlot?: ReactNode
}

export function ModalFooter({
  onSave,
  saveLabel,
  saveVariant = 'default',
  fullWidth = false,
  saving = false,
  saveDisabled = false,
  saveIcon,
  onCancel,
  cancelLabel,
  onDelete,
  deleteLabel,
  deleting = false,
  leftSlot,
}: ModalFooterProps) {
  const { t } = useTranslation('common')
  const busy = saving || deleting
  // 터치 화면은 lg(48) — button.md "터치 우선 화면은 lg 권장", Desk 는 44 strict.
  const mobile = useDeviceSize() === 'mobile'
  const size = mobile ? 'lg' : 'md'
  return (
    <>
      {onDelete && (
        <Button
          type="button"
          // 모바일은 error 솔리드 채움(destructive) + 균등 분배 — 삭제 확인 다이얼로그의
          // 삭제 버튼과 같은 색이라, 같은 동작이 같은 색으로 이어진다. 옅은 채움
          // (dangerSoft)은 다크에서 어두운 자주로 가라앉아 버렸다.
          // 데스크탑은 액션이 셋일 수 있어 기존대로 ghost + flush-left 분리.
          variant={mobile ? 'destructive' : 'ghost'}
          size={size}
          flush={mobile ? undefined : 'left'}
          style={
            mobile
              ? undefined
              : { color: 'var(--fg-expense)', marginRight: 'auto', flex: 'none' }
          }
          onClick={onDelete}
          loading={deleting}
          disabled={saving}
        >
          <Trash2 size={16} /> {deleteLabel ?? t('delete')}
        </Button>
      )}
      {!onDelete && leftSlot && <div style={{ marginRight: 'auto' }}>{leftSlot}</div>}
      {onCancel && (
        <Button
          type="button"
          // 모바일은 secondary(테두리 없는 회색 채움) — ghost 는 배경이 없어 전체 폭
          // 배치에서 버튼으로 안 보인다(spec button.md Migration notes 2026-08).
          variant={mobile ? 'secondary' : 'ghost'}
          size={size}
          onClick={onCancel}
          disabled={busy}
          style={fullWidth ? { flex: 1 } : undefined}
        >
          {cancelLabel ?? t('cancel')}
        </Button>
      )}
      <Button
        type="button"
        variant={saveVariant === 'destructive' ? 'destructive' : 'default'}
        size={size}
        onClick={onSave}
        disabled={saveDisabled || deleting}
        loading={saving}
        style={fullWidth ? { flex: 1 } : undefined}
      >
        {saveIcon}
        {saveLabel}
      </Button>
    </>
  )
}

/**
 * 뷰(읽기전용) 다이얼로그 footer — 좌측 삭제(danger) 또는 leftSlot(금액 토글 등) /
 * 우측 편집. 폼 제출이 없는 상세 다이얼로그용(거래·자산·카드 상세). 앱 PViewFooter 미러.
 *
 * **액션은 2개까지**(spec drawer.md 액션 구성). 상세는 `삭제`·`편집` 이고 `확인` 은 두지
 * 않는다 — 우상단 X 가 같은 동작이라 입구가 둘이 된다. onConfirm 은 X 가 없는 특수 흐름용.
 */
type ModalViewFooterProps = {
  /**
   * 우측 끝 확인/닫기 핸들러 — **없으면 버튼 자체를 렌더하지 않는다**.
   * 상세 footer 는 `삭제`·`편집` 만 둔다(우상단 X 가 이미 닫기 — spec drawer.md 액션 구성).
   */
  onConfirm?: () => void
  confirmLabel?: string
  /**
   * 'default'(primary 확인) | 'secondary'(단일 닫기) | 'ghost'(레거시).
   *
   * 단일 닫기는 `secondary`(테두리 없는 회색 채움) — ghost 는 배경이 없어 전체 폭
   * 배치에서 버튼으로 안 보인다(spec button.md Migration notes 2026-08).
   */
  confirmVariant?: 'default' | 'secondary' | 'ghost'
  /** 우측 편집(opt). */
  onEdit?: () => void
  editLabel?: string
  /** 좌측 삭제(파괴적). leftSlot 과 동시 사용 금지. */
  onDelete?: () => void
  deleteLabel?: string
  deleting?: boolean
  /** 삭제 대신 좌측에 둘 임의 요소(금액 가리기 토글 등). */
  leftSlot?: ReactNode
}

export function ModalViewFooter({
  onConfirm,
  confirmLabel,
  confirmVariant = 'default',
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
  deleting = false,
  leftSlot,
}: ModalViewFooterProps) {
  const { t } = useTranslation('common')
  // 폼 시트와 같은 규칙 — 터치 화면은 lg(48).
  const mobile = useDeviceSize() === 'mobile'
  const size = mobile ? 'lg' : 'md'
  return (
    <>
      {onDelete ? (
        <Button
          type="button"
          // 폼 시트 footer 와 같은 규칙 — 모바일은 error 솔리드 채움 + 균등 분배,
          // 데스크탑은 ghost + flush-left 분리.
          variant={mobile ? 'destructive' : 'ghost'}
          size={size}
          flush={mobile ? undefined : 'left'}
          style={
            mobile
              ? undefined
              : { color: 'var(--fg-expense)', marginRight: 'auto', flex: 'none' }
          }
          onClick={onDelete}
          loading={deleting}
        >
          <Trash2 size={16} /> {deleteLabel ?? t('delete')}
        </Button>
      ) : leftSlot ? (
        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>{leftSlot}</div>
      ) : null}
      {onEdit && (
        <Button
          type="button"
          // 상세의 주 액션은 편집 — 모바일은 확인이 없어 이게 유일한 채움 버튼이다.
          variant={mobile && !onConfirm ? 'default' : 'ghost'}
          size={size}
          onClick={onEdit}
          disabled={deleting}
        >
          <Pencil size={16} /> {editLabel ?? t('edit')}
        </Button>
      )}
      {onConfirm && (
        <Button
          type="button"
          variant={confirmVariant}
          size={size}
          onClick={onConfirm}
          disabled={deleting}
        >
          {confirmLabel ?? t('confirm')}
        </Button>
      )}
    </>
  )
}
