import { useState } from "react";
import {
  ArrowDownUp,
  Copy,
  EllipsisVertical,
  FolderInput,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow } from "@/shared/ds/catalog/DemoKit";
import { OverlayStage } from "@/shared/ds/overlay/overlay-stage";

import {
  MenuSheet,
  MenuSheetContent,
  MenuSheetGroup,
  MenuSheetItem,
  MenuSheetTrigger,
} from "./menu-sheet";
import type { MenuSheetLayout } from "./menu-sheet-variants";

// 무대 — 폰 폭 390. 시트는 무대 아래에 붙고 내용만큼 올라온다
const STAGE = { width: 390, height: 420 };

type Tone = "neutral" | "critical";
type State = "enabled" | "hovered" | "pressed" | "focused" | "disabled";

/**
 * 견본 하나 — 조합(layout · tone)과 상태에 맞는 줄만 담는다(검사기는 첫 줄을 잰다).
 * 호버 · 누름은 첫 줄을 올리고 누르고(pressTarget), 키보드 초점은 첫 줄(또는 보조 기술용 닫기)로 넘긴다.
 */
function Sheet({
  layout = "textWithIcon",
  tone = "neutral",
  state = "enabled",
  focus = "item",
}: {
  layout?: MenuSheetLayout;
  tone?: Tone;
  state?: State;
  focus?: "item" | "close";
}) {
  const textOnly = layout === "textOnly";
  const disabled = state === "disabled";
  const critical = tone === "critical";
  return (
    <OverlayStage
      spec="menu-sheet"
      combo={{ layout, tone }}
      state={state}
      {...STAGE}
      pressTarget={
        state === "hovered" || state === "pressed"
          ? "[data-slot=menu-sheet-item]"
          : undefined
      }
      focusTarget={
        focus === "close"
          ? "[data-slot=menu-sheet-close]"
          : "[data-slot=menu-sheet-item]"
      }
    >
      {(container) => (
        <MenuSheet open modal={false} container={container}>
          <MenuSheetContent
            title="주간 회의 메모"
            description={
              textOnly ? undefined : "이 메모로 할 수 있는 일이에요."
            }
            layout={layout}
          >
            {critical ? (
              <MenuSheetGroup>
                <MenuSheetItem
                  icon={<Trash2 />}
                  label="삭제"
                  description={textOnly ? undefined : "되돌릴 수 없어요."}
                  tone="critical"
                  disabled={disabled}
                />
              </MenuSheetGroup>
            ) : (
              <>
                <MenuSheetGroup>
                  <MenuSheetItem
                    icon={<Pin />}
                    label="고정"
                    description="목록 맨 위에 둬요."
                    disabled={disabled}
                  />
                  <MenuSheetItem
                    icon={<Pencil />}
                    label="수정"
                    disabled={disabled}
                  />
                </MenuSheetGroup>
                {!disabled && (
                  <MenuSheetGroup>
                    <MenuSheetItem
                      icon={<Trash2 />}
                      label="삭제"
                      tone="critical"
                    />
                  </MenuSheetGroup>
                )}
              </>
            )}
          </MenuSheetContent>
        </MenuSheet>
      )}
    </OverlayStage>
  );
}

const STATES: State[] = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
];

/** 직접 눌러 여는 ⋮ — 진짜 모달 시트(화면 아래에서 올라온다). 고른 줄은 시트가 다 닫힌 뒤 실행된다 */
function TryRow() {
  const [last, setLast] = useState("아직 고르지 않았어요");
  return (
    <div className="flex items-center gap-x3">
      <MenuSheet>
        <MenuSheetTrigger asChild>
          <Button
            variant="ghost"
            ghostColor="neutralSubtle"
            layout="iconOnly"
            aria-label="주간 회의 메모 더보기"
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </MenuSheetTrigger>
        <MenuSheetContent title="주간 회의 메모">
          <MenuSheetGroup>
            <MenuSheetItem
              icon={<Pin />}
              label="고정"
              onSelect={() => setLast("고정")}
            />
            <MenuSheetItem
              icon={<Pencil />}
              label="수정"
              onSelect={() => setLast("수정")}
            />
            <MenuSheetItem
              icon={<Copy />}
              label="복사해 새로 쓰기"
              onSelect={() => setLast("복사해 새로 쓰기")}
            />
            <MenuSheetItem
              icon={<FolderInput />}
              label="옮기기"
              disabled
              onSelect={() => setLast("옮기기")}
            />
          </MenuSheetGroup>
          <MenuSheetGroup>
            <MenuSheetItem
              icon={<Trash2 />}
              label="삭제"
              tone="critical"
              onSelect={() => setLast("삭제")}
            />
          </MenuSheetGroup>
        </MenuSheetContent>
      </MenuSheet>
      <span className="text-t3 text-fg-neutral-muted">고른 것: {last}</span>
    </div>
  );
}

/** 머리 더보기 — 제목 없이 트리거의 이름을 숨은 제목으로 쓴다 */
function TryHeader() {
  return (
    <MenuSheet>
      <MenuSheetTrigger asChild>
        <Button
          variant="ghost"
          ghostColor="neutralSubtle"
          layout="iconOnly"
          aria-label="메모 더보기"
        >
          <ArrowDownUp aria-hidden />
        </Button>
      </MenuSheetTrigger>
      <MenuSheetContent layout="textOnly">
        <MenuSheetGroup>
          <MenuSheetItem label="앨범에서 고르기" />
          <MenuSheetItem label="사진 찍기" />
        </MenuSheetGroup>
        <MenuSheetGroup>
          <MenuSheetItem label="사진 지우기" tone="critical" />
        </MenuSheetGroup>
      </MenuSheetContent>
    </MenuSheet>
  );
}

/** 카탈로그(/dev/ds) — 아이콘 + 글 · 글만 × 톤 × 상태, 보조 기술용 닫기의 키보드 초점, 직접 열어 보기 */
export const MenuSheetDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="아이콘 + 글 — 평소 · 올림 · 누름 · 키보드 초점 · 막힌 줄">
      {STATES.map((state) => (
        <DemoRow key={state} label={state}>
          <Sheet state={state} />
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="위험한 동작 — 이름 · 아이콘만 빨강, 올림 · 누르는 동안은 한 단계 짙게">
      {(["enabled", "hovered", "pressed", "focused"] as State[]).map(
        (state) => (
          <DemoRow key={state} label={state}>
            <Sheet tone="critical" state={state} />
          </DemoRow>
        ),
      )}
      <DemoRow label="disabled">
        <Sheet tone="critical" state="disabled" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="글만 — 가운데 정렬, 줄 설명 · 아이콘 없음">
      <DemoRow label="neutral">
        <Sheet layout="textOnly" />
      </DemoRow>
      <DemoRow label="critical">
        <Sheet layout="textOnly" tone="critical" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="보조 기술용 닫기 — 키보드 초점이 오면 보인다(바깥 2px 링)">
      <DemoRow label="focused">
        <Sheet state="focused" focus="close" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 누르기 · 끌어내리기 · Esc · 딤 누르기 · Tab(줄 → 닫기 → 첫 줄)">
      <DemoRow label="줄 ⋮">
        <TryRow />
      </DemoRow>
      <DemoRow label="머리 더보기">
        <TryHeader />
      </DemoRow>
    </DemoBlock>
  </div>
);
