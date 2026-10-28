import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
} from "@/shared/ds/bottom-sheet";
import { Field } from "@/shared/ds/field";
import { InputButton, useInputButtonSurface } from "@/shared/ds/input-button";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ds/popover";
import { focusSearchableList } from "@/shared/ds/searchable-list";

/**
 * 고르기 표면(I-17 18 ~ 20) — 누르는 것(trigger)이 1280 미만은 폼 시트 위 고르기 시트(검색칸 초점), 이상은 그 자리 Popover 를 연다
 * (대화상자 안에서는 겹치지 않는다). 내용은 Searchable List 이고 고르면 `close()` 로 닫는다. 내용 컴포넌트는 닫히면 사라지므로
 * 검색어 · 스위치 같은 찾는 동안의 상태는 그 안에 두면 열 때마다 새로 시작한다.
 */
export function PickerSurface({
  trigger,
  surfaceTitle,
  children,
}: {
  trigger: (api: { open: boolean; show: () => void }) => ReactNode;
  surfaceTitle: string;
  children: (api: { close: () => void }) => ReactNode;
}) {
  const surface = useInputButtonSurface();
  const [open, setOpen] = useState(false);
  const node = trigger({ open, show: () => setOpen(true) });
  const body = children({ close: () => setOpen(false) });
  return surface === "sheet" ? (
    <BottomSheet open={open} onOpenChange={setOpen}>
      {node}
      <BottomSheetContent
        title={surfaceTitle}
        onOpenAutoFocus={focusSearchableList}
      >
        {/* 본문 좌우 여백을 뺀다 — 검색칸 · 줄이 제 24 를 가진다 */}
        <BottomSheetBody className="px-0">{body}</BottomSheetBody>
      </BottomSheetContent>
    </BottomSheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{node}</PopoverTrigger>
      <PopoverContent
        aria-label={surfaceTitle}
        align="start"
        onOpenAutoFocus={focusSearchableList}
      >
        <PopoverBody className="px-0">{body}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

/** 검색해서 고르는 칸 — Field + Input Button 이 고르기 표면을 연다 */
export function PickerField({
  label,
  indicator,
  value,
  placeholder,
  surfaceTitle,
  children,
}: {
  label: string;
  indicator?: string;
  value?: string | null;
  placeholder: string;
  surfaceTitle: string;
  children: (api: { close: () => void }) => ReactNode;
}) {
  return (
    <Field label={label} indicator={indicator}>
      <PickerSurface
        surfaceTitle={surfaceTitle}
        trigger={({ open, show }) => (
          <InputButton
            value={value}
            placeholder={placeholder}
            suffixIcon={<ChevronDown />}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={show}
          />
        )}
      >
        {children}
      </PickerSurface>
    </Field>
  );
}
