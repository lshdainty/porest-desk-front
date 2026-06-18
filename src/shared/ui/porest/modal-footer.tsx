import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'

/**
 * 표준 모달/시트 footer — 좌측 삭제(opt) / 우측 취소 + 저장. 앱 `PSheetFooter` 미러.
 *
 * 웹은 ModalShell 이 footer 를 ReactNode prop 으로 받을 뿐 표준 footer 위젯이 없어
 * 각 다이얼로그가 동일 JSX(삭제 flush-left danger / 취소 ghost / 저장 primary)를 손으로
 * 복붙해 drift(flush 누락·아이콘 크기·variant 불일치)가 반복됐다. 이 컴포넌트로 수렴.
 *
 * 버튼 스펙은 button.md SoT 정합 — size="md"(40/12), 삭제는 ghost+flush="left"+danger 색,
 * 취소 ghost, 저장 primary(default). ModalShell footer 의 `justify-end` flex 안에서
 * 삭제는 marginRight:auto 로 좌측, 취소+저장은 우측에 배치된다.
 *
 * leftSlot(필터 초기화·요약 텍스트 등 삭제가 아닌 좌측 요소)·saveIcon(내보내기/전송)
 * 같은 변형도 지원. 뷰(읽기전용) footer·위저드는 범위 밖(별도 패턴).
 */
type ModalFooterProps = {
  /** 저장(주 액션) 핸들러 + 라벨. */
  onSave: () => void
  saveLabel: string
  /** 저장 진행 중 — spinner + 비활성. */
  saving?: boolean
  /** 저장 불가(폼 미충족 등). */
  saveDisabled?: boolean
  /** 저장 라벨 앞 아이콘 (내보내기 Download / 전송 Send 등). */
  saveIcon?: ReactNode
  /** 취소/닫기 핸들러(보통 onClose). */
  onCancel: () => void
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
  saving = false,
  saveDisabled = false,
  saveIcon,
  onCancel,
  cancelLabel = '취소',
  onDelete,
  deleteLabel = '삭제',
  deleting = false,
  leftSlot,
}: ModalFooterProps) {
  const busy = saving || deleting
  return (
    <>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="md"
          flush="left"
          style={{ color: 'var(--fg-expense)', marginRight: 'auto' }}
          onClick={onDelete}
          loading={deleting}
          disabled={saving}
        >
          <Trash2 size={16} /> {deleteLabel}
        </Button>
      )}
      {!onDelete && leftSlot && <div style={{ marginRight: 'auto' }}>{leftSlot}</div>}
      <Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </Button>
      <Button
        type="button"
        size="md"
        onClick={onSave}
        disabled={saveDisabled || deleting}
        loading={saving}
      >
        {saveIcon}
        {saveLabel}
      </Button>
    </>
  )
}

/**
 * 뷰(읽기전용) 다이얼로그 footer — 좌측 삭제(danger) 또는 leftSlot(금액 토글 등) /
 * 우측 편집(opt) + 확인/닫기. 폼 제출이 없는 상세 다이얼로그용(거래·자산·카드 상세).
 * 앱 PViewFooter 미러.
 */
type ModalViewFooterProps = {
  /** 우측 끝 확인/닫기 핸들러. */
  onConfirm: () => void
  confirmLabel?: string
  /** 'default'(primary 확인) | 'ghost'(단일 닫기). */
  confirmVariant?: 'default' | 'ghost'
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
  confirmLabel = '확인',
  confirmVariant = 'default',
  onEdit,
  editLabel = '편집',
  onDelete,
  deleteLabel = '삭제',
  deleting = false,
  leftSlot,
}: ModalViewFooterProps) {
  return (
    <>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="md"
          flush="left"
          style={{ color: 'var(--fg-expense)', marginRight: 'auto' }}
          onClick={onDelete}
          loading={deleting}
        >
          <Trash2 size={16} /> {deleteLabel}
        </Button>
      ) : leftSlot ? (
        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>{leftSlot}</div>
      ) : null}
      {onEdit && (
        <Button type="button" variant="ghost" size="md" onClick={onEdit} disabled={deleting}>
          <Pencil size={16} /> {editLabel}
        </Button>
      )}
      <Button
        type="button"
        variant={confirmVariant === 'ghost' ? 'ghost' : 'default'}
        size="md"
        onClick={onConfirm}
        disabled={deleting}
      >
        {confirmLabel}
      </Button>
    </>
  )
}
