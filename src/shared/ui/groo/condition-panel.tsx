import { useRef, useState, type ReactNode, type Ref } from "react";
import { ChevronDown } from "lucide-react";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import { Chip, type ChipSize } from "@/shared/ds/chip";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
} from "@/shared/ds/popover";

/*
 * 필터 바의 조건 면 (I-07 28 ~ 30 · I-10 30) — 조건마다 칩 하나, 누르면 그 조건 하나만 연다. 1280 이상 Popover(폭 400), 미만 Bottom Sheet.
 * "완료" 로만 반영한다 — 바깥 누름 · Esc · ✕ 는 바꾼 것을 버린다. "초기화" 는 그 조건만 비운다.
 * 가계부 필터 바와 할 일 필터 바가 같은 껍데기를 쓴다 — 조건 본문과 칩 글은 화면이 채운다.
 */

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** 칩 하나가 여는 조건 면 — 열릴 때 마운트되어 초안(draft)을 새로 쥔다 */
export function ConditionPanel<T>({
  chipLabel,
  active,
  title,
  size,
  wide,
  initial,
  empty,
  canApply = () => true,
  onApply,
  body,
  chipRef,
  resetLabel,
  doneLabel,
}: {
  chipLabel: string;
  active: boolean;
  title: string;
  size: ChipSize;
  wide: boolean;
  initial: T;
  /** "초기화" 가 만드는 값 — 그 조건만 비운다 */
  empty: T;
  canApply?: (draft: T) => boolean;
  onApply: (draft: T) => void;
  body: (draft: T, set: (next: T) => void) => ReactNode;
  chipRef?: Ref<HTMLButtonElement>;
  /** 바닥 버튼 글 — "초기화" · "완료" */
  resetLabel: string;
  doneLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const own = useRef<HTMLButtonElement | null>(null);
  const setRefs = (node: HTMLButtonElement | null) => {
    own.current = node;
    assignRef(chipRef, node);
  };
  const chip = (
    <Chip
      ref={setRefs}
      variant="solid"
      size={size}
      selected={active}
      className="max-w-full"
      suffixIcon={<ChevronDown />}
      aria-haspopup="dialog"
      onClick={wide ? undefined : () => setOpen(true)}
    >
      {chipLabel}
    </Chip>
  );
  const close = () => {
    setOpen(false);
    // 시트는 트리거가 따로 없어 초점을 직접 돌린다(팝오버는 스스로 돌린다)
    if (!wide) requestAnimationFrame(() => own.current?.focus());
  };
  const inner = (
    <PanelInner
      wide={wide}
      initial={initial}
      empty={empty}
      canApply={canApply}
      resetLabel={resetLabel}
      doneLabel={doneLabel}
      onApply={(d) => {
        onApply(d);
        close();
      }}
      body={body}
    />
  );
  if (wide) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{chip}</PopoverTrigger>
        <PopoverContent title={title} align="start" className="w-[400px]">
          {inner}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <>
      {chip}
      <BottomSheet
        open={open}
        form
        onOpenChange={(o) => (o ? setOpen(true) : close())}
      >
        <BottomSheetContent title={title} aria-describedby={undefined}>
          {inner}
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}

function PanelInner<T>({
  wide,
  initial,
  empty,
  canApply,
  onApply,
  body,
  resetLabel,
  doneLabel,
}: {
  wide: boolean;
  initial: T;
  empty: T;
  canApply: (draft: T) => boolean;
  onApply: (draft: T) => void;
  body: (draft: T, set: (next: T) => void) => ReactNode;
  resetLabel: string;
  doneLabel: string;
}) {
  const [draft, setDraft] = useState<T>(initial);
  const footer = (
    <>
      <Button variant="neutralWeak" onClick={() => setDraft(empty)}>
        {resetLabel}
      </Button>
      <Button disabled={!canApply(draft)} onClick={() => onApply(draft)}>
        {doneLabel}
      </Button>
    </>
  );
  return wide ? (
    <>
      <PopoverBody>{body(draft, setDraft)}</PopoverBody>
      <PopoverFooter>{footer}</PopoverFooter>
    </>
  ) : (
    <>
      <BottomSheetBody scrollFog>{body(draft, setDraft)}</BottomSheetBody>
      <BottomSheetFooter>{footer}</BottomSheetFooter>
    </>
  );
}
