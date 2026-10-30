import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { useLeaveConfirm } from "@/shared/ds/alert-dialog";
import { Button } from "@/shared/ds/button";
import { Callout } from "@/shared/ds/callout";
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
  /** 빠른 추가에서 쓴 값을 들고 왔다 — 그 값도 "바뀐 값" 으로 쳐서 닫을 때 묻는다(RHF 기본값이 되어 isDirty 가 false 이므로) */
  initialDirty?: boolean;
  /** 저장(추가 · 수정)이 실패했다 — 폼 맨 위에 critical Callout(고정 문구), 폼은 열려 있고 입력값은 그대로 */
  saveError?: boolean;
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
  initialDirty = false,
  labels = [],
  onSubmit,
  onClose,
  isLoading,
  saveError = false,
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
  const [stepOrigin, setStepOrigin] = useState("");
  const endRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const titleEmpty = !title;
  const rangeError = showErrors && dateRangeInvalid;
  const dirty = form.formState.isDirty || initialDirty;

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

  // 저장 실패 — 서버 글 대신 고정 문구(snackbar.md:75). 폼 맨 위, 나중에 나타나는 위험이라 role=alert
  const errorCallout = saveError ? (
    <div ref={errorRef}>
      <Callout tone="critical" role="alert" className="mb-x4">
        {t("form.saveFailed")}
      </Callout>
    </div>
  ) : null;
  // 실패하면 폼 맨 위로 — 아래(설명 · 바닥 가까이)까지 내려온 채 저장했을 때 위의 알림이 화면 밖에 있지 않게(snackbar.md:75)
  useEffect(() => {
    if (saveError) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [saveError]);

  // 새 일정은 제목에 초점(Text Field focused — 안쪽 2px 짙은 테두리 + 캐럿). 정식 길: 표면의 열림 초점(Radix onOpenAutoFocus)에서 기본(표면 자신)을 막고
  // 제목 칸에 직접 초점을 준다 — 타이머 없음. 수정으로 열 때는 주지 않고 표면이 받는다
  const focusTitleOnOpen = (e: Event) => {
    // 수정으로 열 때는 막지 않는다 — 기본 동작(표면 자신이 초점을 받는다)을 그대로 둔다. 막으면 초점이 어디에도 안 간다
    if (event) return;
    e.preventDefault();
    const root = e.target instanceof HTMLElement ? e.target : document;
    const input = root.querySelector<HTMLInputElement>('input[name="title"]');
    if (input) input.focus({ preventScroll: true });
    else form.setFocus("title");
  };

  const heading = event ? t("editEvent") : t("addEvent");
  const del = event && onDelete ? onDelete : undefined;

  // 장소 · 설명 한 단계
  const enterStep = (next: "location" | "description") => {
    const origin =
      (next === "location" ? ctrl.location : ctrl.description) ?? "";
    setDraft(origin);
    setStepOrigin(origin);
    setStep(next);
  };
  const confirmStep = () => {
    if (step !== "list") {
      form.setValue(step, draft, { shouldDirty: true });
    }
    setStep("list");
  };
  const cancelStep = () => setStep("list");
  // ← · 기기 뒤로 가기 · Esc — 친 글이 들어올 때와 다르면 "작성한 내용이 사라져요" 를 묻고, 같으면 묻지 않는다(bottom-sheet.md 두 단계 시트의 머리 ←). "완료" 는 묻지 않는다
  const leave = useLeaveConfirm({
    dirty: step !== "list" && draft !== stepOrigin,
    leave: cancelStep,
    contentRef,
  });
  // 물었으면(false) 칸을 다시 쌓아 [계속 작성] 뒤에도 뒤로 가기가 이 단계로 온다
  useStepBack(!wide && step !== "list", () => leave.request());

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
        <DialogContent title={heading} onOpenAutoFocus={focusTitleOnOpen}>
          <DialogBody scrollFog>
            {errorCallout}
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
        if (inStep) leave.request();
        else onClose();
      }}
    >
      <BottomSheetContent
        title={inStep ? t(`form.${step}`) : heading}
        aria-describedby={undefined}
        ref={contentRef}
        showCloseButton={!inStep}
        onBack={inStep ? () => void leave.request() : undefined}
        onOpenAutoFocus={focusTitleOnOpen}
      >
        {leave.node}
        {inStep && <SheetStepDone onClick={confirmStep} />}
        <BottomSheetBody scrollFog>
          {step === "list" && errorCallout}
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
              className="pb-x2 pt-x1 [&_label]:sr-only"
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
            {/* 바닥 왼쪽 [삭제] 는 ghost + critical 글자만큼(large), 주 버튼이 남은 폭을 채운다(bottom-sheet.md 바닥 · button.md 모달 footer 꼴) */}
            <div className="flex w-full items-center gap-x2">
              {del && (
                <Button
                  variant="ghost"
                  ghostColor="critical"
                  size="large"
                  className="shrink-0"
                  onClick={del}
                >
                  {tc("delete")}
                </Button>
              )}
              <Button
                size="large"
                className="flex-1"
                loading={isLoading}
                onClick={save}
              >
                {tc("save")}
              </Button>
            </div>
          </BottomSheetFooter>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
};
