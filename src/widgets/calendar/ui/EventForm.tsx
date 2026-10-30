import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
} from "@/shared/ds/dialog";
import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import { useWideSurface } from "@/shared/ds/overlay";
import { Textarea } from "@/shared/ds/textarea";
import {
  CONTENT_MAX,
  LOCATION_MAX,
  useEventForm,
  type EventFormInitial,
} from "@/widgets/calendar/model/use-event-form";
import { EventFormDialogBody } from "./event-form/dialog-body";
import { EventFormSheetBody } from "./event-form/sheet-body";
import { SheetStepDone } from "./event-form/step-header";
import { useStepBack } from "@/widgets/calendar/model/use-step-back";
import type { EventFormView } from "./event-form/types";

import type {
  CalendarEvent,
  CalendarEventFormValues,
} from "@/entities/calendar";
import type { EventLabel } from "@/entities/event-label";

interface EventFormProps {
  event?: CalendarEvent | null;
  selectedDate?: Date;
  selectedEndDate?: Date;
  /** 빠른 추가에서 "자세히" 로 들고 온 값 */
  initial?: EventFormInitial;
  labels?: EventLabel[];
  onSubmit: (data: CalendarEventFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
  /** 수정 모드 삭제 — 제공 시 바닥 왼쪽에 [삭제](ghost critical)를 둔다. 확인창은 부르는 쪽이 연다. */
  onDelete?: () => void;
}

type Step = "list" | "location" | "description";

/**
 * 일정 추가 · 수정 폼 (I-09 21 ~ 32) — 1280 미만은 ds Bottom Sheet 입력 폼(제목 칸 + List 줄 칸 · 장소 · 설명은 같은 시트 안 한 단계),
 * 1280 이상은 "자세히" ds Dialog 480(Field 칸). 상태는 이 컴포넌트가 한 번 들고(`useEventForm`) 두 표면이 읽으므로 1280 을 넘나들어도
 * 값이 남는다. [저장] 은 켜 두고 누를 때 비거나 틀린 칸마다 오류를 보이며 첫 오류 칸으로 초점을 옮긴다.
 * 바깥 누르기 · 끌어내리기로는 닫히지 않고, 바뀐 값이 있으면 닫기 전에 "작성한 내용이 사라져요" 를 묻는다.
 */
export const EventForm = ({
  event,
  selectedDate,
  selectedEndDate,
  initial,
  labels = [],
  onSubmit,
  onClose,
  isLoading,
  onDelete,
}: EventFormProps) => {
  const { t } = useTranslation("calendar");
  const { t: tc } = useTranslation("common");
  const wide = useWideSurface();
  const ctrl = useEventForm({
    event,
    selectedDate,
    selectedEndDate,
    initial,
    onSubmit,
  });
  const { form, title, dateRangeInvalid, onFormSubmit, handleSubmit } = ctrl;

  const [showErrors, setShowErrors] = useState(false);
  const [step, setStep] = useState<Step>("list");
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLButtonElement>(null);

  const titleEmpty = !title;
  const rangeError = showErrors && dateRangeInvalid;
  const dirty = form.formState.isDirty;

  const view: EventFormView = {
    ctrl,
    labels,
    showErrors,
    titleEmpty,
    rangeError,
    endRef,
  };

  const save = () => {
    if (isLoading) return;
    setShowErrors(true);
    // 첫 오류 칸으로 — 제목 → 종료
    if (titleEmpty) {
      form.setFocus("title");
      return;
    }
    if (dateRangeInvalid) {
      endRef.current?.focus();
      return;
    }
    void handleSubmit(onFormSubmit)();
  };

  const heading = event ? t("editEvent") : t("addEvent");
  const del = event && onDelete ? onDelete : undefined;

  // 장소 · 설명 한 단계
  const enterStep = (next: "location" | "description") => {
    setDraft((next === "location" ? ctrl.location : ctrl.description) ?? "");
    setStep(next);
  };
  const confirmStep = () => {
    if (step !== "list") {
      form.setValue(step, draft, { shouldDirty: true });
    }
    setStep("list");
  };
  const cancelStep = () => setStep("list");
  useStepBack(!wide && step !== "list", cancelStep);

  if (wide) {
    return (
      <Dialog
        open
        form
        dirty={dirty}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <DialogContent
          title={heading}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            form.setFocus("title");
          }}
        >
          <DialogBody scrollFog>
            <EventFormDialogBody view={view} />
          </DialogBody>
          <DialogFooter>
            {del && (
              <Button
                variant="ghost"
                ghostColor="critical"
                className="mr-auto"
                onClick={del}
              >
                {tc("delete")}
              </Button>
            )}
            <DialogCancel>{tc("cancel")}</DialogCancel>
            <Button loading={isLoading} onClick={save}>
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const inStep = step !== "list";
  return (
    <BottomSheet
      open
      form
      // 장소 · 설명 단계의 Esc · 뒤로 가기는 친 글을 버리고 줄 칸으로 돌아간다 — 시트를 닫는 물음은 줄 칸 단계에서만
      dirty={dirty && !inStep}
      onOpenChange={(next) => {
        if (next) return;
        if (inStep) cancelStep();
        else onClose();
      }}
    >
      <BottomSheetContent
        title={inStep ? t(`form.${step}`) : heading}
        aria-describedby={undefined}
        showCloseButton={!inStep}
        onBack={inStep ? cancelStep : undefined}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (!event) form.setFocus("title");
        }}
      >
        {inStep && <SheetStepDone onClick={confirmStep} />}
        <BottomSheetBody scrollFog>
          {step === "list" && (
            <EventFormSheetBody view={view} onStep={enterStep} />
          )}
          {step === "location" && (
            <div className="pb-x2 pt-x3">
              <Input
                size="large"
                autoFocus
                aria-label={t("form.location")}
                value={draft}
                placeholder={t("form.locationPlaceholder")}
                maxLength={LOCATION_MAX}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmStep();
                  }
                }}
              />
            </div>
          )}
          {step === "description" && (
            <Field
              label={t("form.description")}
              maxGraphemeCount={CONTENT_MAX}
              className="pb-x2 pt-x3 [&_label]:sr-only"
            >
              <Textarea
                autoFocus
                rows={3}
                value={draft}
                placeholder={t("form.descriptionPlaceholder")}
                onChange={(e) => setDraft(e.target.value)}
              />
            </Field>
          )}
        </BottomSheetBody>
        {!inStep && (
          <BottomSheetFooter>
            {del && (
              <Button variant="ghost" ghostColor="critical" onClick={del}>
                {tc("delete")}
              </Button>
            )}
            <Button loading={isLoading} onClick={save}>
              {tc("save")}
            </Button>
          </BottomSheetFooter>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
};
