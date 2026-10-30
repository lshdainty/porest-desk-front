import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

import type { IEvent } from "@/widgets/calendar/model/interfaces";

interface EventDetailActionsProps {
  event: IEvent;
  onEdit: () => void;
  onDelete: () => void;
}

/** 일정 상세 바닥 — 삭제(좌, ghost danger) / 수정(primary). 공휴일 같은 읽기 전용 일정에는 그리지 않는다. */
const EventDetailActions = ({
  event,
  onEdit,
  onDelete,
}: EventDetailActionsProps) => {
  const { t } = useTranslation("calendar");
  const isCalendarSource = event.sourceType === "calendar";
  return (
    <>
      {isCalendarSource && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-fg-critical hover:text-fg-critical"
            style={{ marginRight: "auto" }}
          >
            <Trash2 className="mr-1 size-3.5" />
            {t("deleteEvent")}
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Pencil className="mr-1 size-3.5" />
            {t("editEvent")}
          </Button>
        </div>
      )}
    </>
  );
};

export { EventDetailActions };
