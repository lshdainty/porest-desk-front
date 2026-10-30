import { useTranslation } from "react-i18next";

import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import { Callout } from "@/shared/ds/callout";
import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import { Textarea } from "@/shared/ds/textarea";
import type { EventFormFlow } from "@/widgets/calendar/model/use-event-form-flow";
import {
  CONTENT_MAX,
  LOCATION_MAX,
} from "@/widgets/calendar/model/use-event-form";
import { EventFormSheetBody } from "./sheet-body";
import { SheetStepDone } from "./step-header";

import type { ComponentProps } from "react";

/**
 * 일정 폼의 시트 안쪽 (I-09 21 ~ 31) — 머리("일정 추가" · "일정 수정") · 제목 칸 + 줄 칸 아홉 · 바닥 [삭제][저장].
 * 장소 · 설명은 같은 시트 안 한 단계(← 와 "완료"). `BottomSheet` 안에 둔다 — 시트 바탕(root)은 부르는 쪽이 들고
 * (`EventForm` 은 폼만 담은 시트, 일정 상세는 목록 · 상세와 한 시트), 값 · 단계는 `flow`(`useEventFormFlow`)가 든다.
 */
export function EventFormSheetPanel({
  flow,
  ...contentProps
}: {
  flow: EventFormFlow;
} & Omit<
  ComponentProps<typeof BottomSheetContent>,
  "title" | "children" | "showCloseButton" | "onBack"
>) {
  const { t } = useTranslation("calendar");
  const { t: tc } = useTranslation("common");
  const {
    ctrl,
    view,
    step,
    inStep,
    draft,
    setDraft,
    heading,
    del,
    isLoading,
    save,
    enterStep,
    confirmStep,
    cancelStep,
  } = flow;
  const { form } = ctrl;
  return (
    <BottomSheetContent
      title={inStep ? t(`form.${step}`) : heading}
      aria-describedby={undefined}
      showCloseButton={!inStep}
      onBack={inStep ? cancelStep : undefined}
      onOpenAutoFocus={flow.focusTitleOnOpen}
      {...contentProps}
    >
      {inStep && <SheetStepDone onClick={confirmStep} />}
      <BottomSheetBody scrollFog>
        {step === "list" && flow.saveError && (
          // 저장 실패 — 서버 글 대신 고정 문구(snackbar.md:75). 폼 맨 위, 나중에 나타나는 위험이라 role=alert
          <Callout tone="critical" role="alert" className="mb-x4">
            {t("form.saveFailed")}
          </Callout>
        )}
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
  );
}
