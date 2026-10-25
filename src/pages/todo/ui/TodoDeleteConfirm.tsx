import { useTranslation } from "react-i18next";
import { AlertConfirm } from "@/shared/ui/groo/alert-confirm";

/** 할 일 삭제 확인 — 상세에서 지울 때와 밀어서 지울 때가 같은 글이다(제목 "할 일 삭제"). */
export function TodoDeleteConfirm({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  /** 지운다 — 끝날 때까지 확인창이 로딩을 문다. 실패하면 던진다 */
  onConfirm: () => Promise<unknown> | void;
  onClose: () => void;
}) {
  const { t } = useTranslation("todo");
  return (
    <AlertConfirm
      title={t("deleteConfirm.title")}
      message={t("deleteConfirm.message", { name })}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
