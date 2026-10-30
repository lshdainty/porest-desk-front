import { EventDetailActions } from "@/widgets/calendar/ui/event-detail/event-detail-actions";
import { EventDetailBody } from "@/widgets/calendar/ui/event-detail/event-detail-body";

import type { IEvent } from "@/widgets/calendar/model/interfaces";

interface EventDetailPopoverProps {
  event: IEvent;
  onEdit: () => void;
  onDelete: () => void;
}

/** 일정 상세 — 본문(`EventDetailBody`)과 바닥(`EventDetailActions`)을 잇는 지금 표면(폰 Drawer · 데스크톱 Popover 공용). */
const EventDetailPopover = ({
  event,
  onEdit,
  onDelete,
}: EventDetailPopoverProps) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <EventDetailBody event={event} />
    <EventDetailActions event={event} onEdit={onEdit} onDelete={onDelete} />
  </div>
);

export { EventDetailPopover };
