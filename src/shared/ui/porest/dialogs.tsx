import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDeviceSize } from "@/shared/lib/porest/responsive";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { Button } from "@/shared/ui/button";

export type ModalSize = "sm" | "md" | "lg";

/**
 * Porest 디자인 시스템 모달 래퍼.
 * - 모바일: vaul Drawer (스와이프 닫힘)
 * - 데스크탑: shadcn Dialog (Radix 기반, .modal 디자인)
 *
 * Unmount 패턴: 부모가 조건부 마운트하면 열림. onClose 호출 시 부모가 unmount.
 */
export function ModalShell({
  title,
  onClose,
  size = "md",
  footer,
  children,
  mobile,
  mobileMinHeight,
}: {
  title: ReactNode;
  onClose: () => void;
  size?: ModalSize;
  footer?: ReactNode;
  children?: ReactNode;
  mobile: boolean;
  /** 모바일 drawer 최소 높이 (예: '85dvh') — 앱 showPSheet initialChildSize 0.85 정합.
   *  미지정 시 기존처럼 content 높이. */
  mobileMinHeight?: string;
}) {
  const { t } = useTranslation("common");
  if (mobile) {
    return (
      <Drawer
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DrawerContent
          className="max-h-[88%]"
          style={mobileMinHeight ? { minHeight: mobileMinHeight } : undefined}
        >
          <DrawerHeader>
            <DrawerTitle className="flex-1">{title}</DrawerTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerHeader>
          <DrawerBody>{children}</DrawerBody>
          {footer && (
            // 모바일 footer 는 버튼을 가로 균등 분배한다(spec drawer.md:35 — 한 손 조작 폭).
            // 우측 정렬 compact 로 두면 화면 구석의 작은 알약이 되어 누르기 어렵다.
            // 삭제처럼 marginRight:auto 로 좌측에 붙는 보조 액션은 균등분배에서 빠진다.
            <div className="flex items-center gap-2 px-xl py-3 [&>button]:flex-1">
              {footer}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose
            aria-label={t("close")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <X size={18} />
          </DialogClose>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  singleAction,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  /**
   * 확인 하나만 그린다 — 고를 것이 없는 차단 통지
   * (spec alert-dialog.md Variants · acknowledge). 취소를 나란히 두면 두 버튼이
   * 같은 일(닫기)을 한다. 제목은 결과 명사구(`삭제 불가`)로 쓴다.
   *
   * [onCancel] 은 그대로 필수다 — ESC·overlay 로 닫는 경로가 그걸 쓴다.
   */
  singleAction?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("common");
  // 모바일 footer 는 취소를 secondary(테두리 없는 회색 채움) + size lg(48) 로 둔다 —
  // ghost 는 배경이 없어 전체 폭 두 버튼 중 한쪽이 빈자리처럼 보인다
  // (spec button.md Migration notes 2026-08 · dialog.md 114-116). 폭 배분은 DialogFooter 가 맡는다.
  const isMobile = useDeviceSize() === "mobile";
  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p
            style={{
              fontSize: "var(--text-body-sm)",
              color: "var(--fg-secondary)",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            {message}
          </p>
        </DialogBody>
        <DialogFooter>
          {!singleAction && (
            /* 취소는 비동기 작업(loading) 중에도 원래 상태 유지 — busy 표시는 확인 버튼 스피너로만. */
            <Button
              variant={isMobile ? "secondary" : "ghost"}
              size={isMobile ? "lg" : undefined}
              onClick={onCancel}
            >
              {cancelLabel ?? t("cancel")}
            </Button>
          )}
          <Button
            variant={danger ? "destructive" : "default"}
            size={isMobile ? "lg" : undefined}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
