import { useState } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow } from "@/shared/ds/catalog/DemoKit";
import { Input } from "@/shared/ds/input";
import { ListItem, ListRadioGroup, ListRadioItem } from "@/shared/ds/list";
import { OverlayStage } from "@/shared/ds/overlay/overlay-stage";

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetTrigger,
} from "./bottom-sheet";

// 무대 — 폰 폭 390. 시트는 무대 아래에 붙고 내용만큼 올라온다
const STAGE = { width: 390, height: 560 };

const PERIODS = [
  "오늘",
  "이번 주",
  "이번 달",
  "지난 달",
  "최근 3개월",
  "올해",
  "직접 고르기",
];

// 긴 목록 — 데이터에 따라 길어지는 본문(끝 흐림 위 20 · 아래 80)
const MANY = Array.from({ length: 24 }, (_, i) => `카테고리 ${i + 1}`);

type Common = {
  state?: "enabled" | "pressed" | "focused";
};

function Stage({
  combo,
  state = "enabled",
  children,
}: {
  combo: Record<string, string>;
  state?: string;
  children: (container: HTMLElement) => React.ReactNode;
}) {
  return (
    <OverlayStage
      spec="bottom-sheet"
      combo={combo}
      state={state}
      {...STAGE}
      pressTarget={
        state === "pressed" ? "[data-slot=bottom-sheet-close]" : undefined
      }
      focusTarget="[data-slot=bottom-sheet-close]"
    >
      {children}
    </OverlayStage>
  );
}

/** 고르기 — 기간. 바깥 누르기 · 끌어내리기로 닫히는 조회 · 고르기 시트(손잡이 없음) */
function Pick({ state }: Common) {
  return (
    <Stage combo={{ handle: "hidden", scrollFog: "off" }} state={state}>
      {(container) => (
        <BottomSheet open modal={false} container={container}>
          <BottomSheetContent
            title="기간"
            description="고른 기간의 거래만 보여요."
          >
            <BottomSheetBody className="px-0">
              <ListRadioGroup aria-label="기간" defaultValue="이번 달">
                {PERIODS.slice(0, 4).map((p) => (
                  <ListRadioItem key={p} value={p} title={p} />
                ))}
              </ListRadioGroup>
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button variant="neutralWeak">초기화</Button>
              <Button>적용</Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </Stage>
  );
}

/** 입력 폼 — 위 닫기 + 바닥 저장 하나, 바깥 · 끌기로 닫지 않는다(form) */
function Form() {
  return (
    <Stage combo={{ handle: "hidden", scrollFog: "off" }}>
      {(container) => (
        <BottomSheet open form modal={false} container={container}>
          <BottomSheetContent title="거래 추가">
            <BottomSheetBody>
              <div className="flex flex-col gap-x3">
                <Input aria-label="금액" placeholder="금액" />
                <Input aria-label="메모" placeholder="메모" />
              </div>
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button type="submit">저장</Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </Stage>
  );
}

/** 끝 흐림 — 넘칠 수 있는 본문(긴 목록). 위 20 · 아래 80 이 늘 흐리다 */
function Fog() {
  return (
    <Stage combo={{ handle: "hidden", scrollFog: "on" }}>
      {(container) => (
        <BottomSheet open modal={false} container={container}>
          <BottomSheetContent title="카테고리" className="max-h-[480px]">
            <BottomSheetBody scrollFog className="px-0">
              <ul className="m-0 list-none p-0">
                {MANY.map((c) => (
                  <ListItem key={c} title={c} />
                ))}
              </ul>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </Stage>
  );
}

/** 손잡이 — 스냅 높이를 둘 때만. 누르면 다음 높이로, 가장 높은 높이에서 누르면 닫는다 */
function Handle() {
  return (
    <Stage combo={{ handle: "shown", scrollFog: "off" }}>
      {(container) => (
        <BottomSheet
          open
          modal={false}
          container={container}
          snapPoints={["320px", "480px"]}
        >
          <BottomSheetContent
            title="거래 상세"
            className="h-[480px] max-h-[480px]"
          >
            <BottomSheetBody className="px-0">
              <ul className="m-0 list-none p-0">
                <ListItem title="금액" detail="12,000원" />
                <ListItem title="날짜" detail="10월 15일" />
                <ListItem title="카테고리" detail="식비" />
              </ul>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </Stage>
  );
}

/**
 * 직접 열어 보기 — 진짜 모달이다(딤 · 초점 가둠 · Esc · 바깥 누르기 · 아래로 끌기 · 뒤 화면 숨김 · 스크롤 잠금).
 * 다크 판에서도 그 판의 색으로 뜨게 판 안의 자리로 띄운다. 입력 폼은 바깥 · 끌기로 닫히지 않고, 값을 적고 닫으면 묻는다.
 */
function Try() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const [memo, setMemo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div ref={setPlace} className="flex flex-wrap gap-x2">
      <BottomSheet container={place}>
        <BottomSheetTrigger asChild>
          <Button variant="neutralWeak" size="small">
            조회 시트 열기
          </Button>
        </BottomSheetTrigger>
        <BottomSheetContent title="거래 상세">
          <BottomSheetBody className="px-0">
            <ul className="m-0 list-none p-0">
              <ListItem title="금액" detail="12,000원" />
              <ListItem title="날짜" detail="10월 15일" />
            </ul>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
      <BottomSheet
        form
        dirty={memo !== ""}
        container={place}
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setMemo("");
        }}
      >
        <BottomSheetTrigger asChild>
          <Button variant="neutralWeak" size="small">
            입력 폼 시트 열기
          </Button>
        </BottomSheetTrigger>
        <BottomSheetContent title="거래 추가">
          <BottomSheetBody>
            <Input
              aria-label="메모"
              placeholder="메모를 적고 닫아 보세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </BottomSheetBody>
          <BottomSheetFooter>
            <Button type="button" onClick={() => setFormOpen(false)}>
              저장
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 쓰임(고르기 · 입력 폼) · 끝 흐림 · 손잡이 · 닫기 버튼의 누름 · 키보드 초점, 직접 열어 보기 */
export const BottomSheetDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="쓰임 — 고르기(조회) 시트 · 입력 폼 시트(바닥은 저장 하나)">
      <DemoRow label="고르기">
        <Pick />
      </DemoRow>
      <DemoRow label="입력 폼">
        <Form />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="끝 흐림(scrollFog) — 넘칠 수 있는 본문 · 위 20 · 아래 80 이 늘 흐리다">
      <DemoRow label="scrollFog on">
        <Fog />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="손잡이(handle shown) — 스냅 높이를 둘 때만 · 36 × 4">
      <DemoRow label="handle shown">
        <Handle />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="상태 — 닫기 버튼 누름(원 바탕 + 2px 거리 축소) · 키보드 초점(링 2px · 띄움 2px)">
      <DemoRow label="pressed">
        <Pick state="pressed" />
      </DemoRow>
      <DemoRow label="focused">
        <Pick state="focused" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 조회는 바깥 · 끌기로 닫힌다 · 입력 폼은 안 닫히고 값이 있으면 닫기 전에 묻는다">
      <DemoRow label="시트">
        <Try />
      </DemoRow>
    </DemoBlock>
  </div>
);
