import { useState } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow } from "@/shared/ds/catalog/DemoKit";
import { Input } from "@/shared/ds/input";
import { ListItem } from "@/shared/ds/list";
import { OverlayStage } from "@/shared/ds/overlay/overlay-stage";

import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogCancel,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogTrigger,
} from "./dialog";

type Size = "medium" | "large";
type Fog = "off" | "on";
type State = "enabled" | "scrolled" | "pressed" | "focused";

// 무대 — medium 480 + 좌우 20, large 800 + 좌우 20(+ 무대 테두리 2). 높이는 대화상자가 가운데에 서도록 넉넉히
const STAGE: Record<Size, { width: number; height: number }> = {
  medium: { width: 522, height: 460 },
  large: { width: 842, height: 460 },
};

const ROWS = Array.from({ length: 16 }, (_, i) => `거래 ${i + 1}`);

// 본문을 위로 스크롤해 두기 — scrolled 견본이 머리 아래 선을 그리게
const scrollBody = (stage: HTMLElement) => {
  const body = stage.querySelector<HTMLElement>("[data-slot=dialog-body]");
  if (body) body.scrollTop = 48;
};

function Stage({
  size,
  fog,
  state,
  children,
}: {
  size: Size;
  fog: Fog;
  state: State;
  children: (container: HTMLElement) => React.ReactNode;
}) {
  return (
    <OverlayStage
      spec="dialog"
      combo={{ size, scrollFog: fog }}
      state={state}
      {...STAGE[size]}
      pressTarget={state === "pressed" ? "[data-slot=dialog-close]" : undefined}
      focusTarget="[data-slot=dialog-close]"
      prepare={state === "scrolled" ? scrollBody : undefined}
    >
      {children}
    </OverlayStage>
  );
}

/** 조회 — 머리 닫기 버튼 + 바깥 누르기로 닫힘. 길이가 데이터에 따라 느는 본문이라 scrollFog */
function View({
  size = "medium",
  fog = "on",
  state = "enabled",
}: {
  size?: Size;
  fog?: Fog;
  state?: State;
}) {
  return (
    <Stage size={size} fog={fog} state={state}>
      {(container) => (
        <Dialog open modal={false} container={container}>
          <DialogContent
            title="거래 상세"
            size={size}
            description="이번 달 거래 내역이에요."
            className="max-h-[400px]"
          >
            <DialogBody scrollFog={fog === "on"} className="px-0">
              <ul className="m-0 list-none p-0">
                {ROWS.map((r) => (
                  <ListItem key={r} title={r} detail="12,000원" />
                ))}
              </ul>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </Stage>
  );
}

/** 입력 폼 — 바닥 [취소] [신청], 머리 닫기 버튼 없음, 바깥 누르기로 닫지 않는다 */
function Form({ size = "medium" }: { size?: Size }) {
  return (
    <Stage size={size} fog="off" state="enabled">
      {(container) => (
        <Dialog open form modal={false} container={container}>
          <DialogContent
            title="휴가 신청"
            size={size}
            description="승인되면 알려드려요."
          >
            <DialogBody>
              <div className="flex flex-col gap-x3">
                <Input aria-label="휴가 종류" placeholder="휴가 종류" />
                <Input aria-label="기간" placeholder="기간" />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogCancel>취소</DialogCancel>
              <Button>신청</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Stage>
  );
}

/**
 * 직접 열어 보기 — 진짜 모달이다. 다크 판에서도 그 판의 색으로 뜨게 판 안의 자리로 띄운다.
 * ResponsiveDialog 라 창 폭이 1280 이상이면 대화상자, 미만이면 시트다(폭을 줄여 보면 열린 채 바뀐다 — 입력값은 부모가 든다).
 */
function Try() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const [memo, setMemo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div ref={setPlace} className="flex flex-wrap gap-x2">
      <ResponsiveDialog container={place}>
        <ResponsiveDialogTrigger asChild>
          <Button variant="neutralWeak" size="small">
            조회 열기
          </Button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent title="거래 상세">
          <ResponsiveDialogBody scrollFog className="px-0">
            <ul className="m-0 list-none p-0">
              {ROWS.map((r) => (
                <ListItem key={r} title={r} detail="12,000원" />
              ))}
            </ul>
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <ResponsiveDialog
        form
        dirty={memo !== ""}
        container={place}
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setMemo("");
        }}
      >
        <ResponsiveDialogTrigger asChild>
          <Button variant="neutralWeak" size="small">
            입력 폼 열기
          </Button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent title="휴가 신청">
          <ResponsiveDialogBody>
            <Input
              aria-label="사유"
              placeholder="사유를 적고 닫아 보세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogCancel>취소</ResponsiveDialogCancel>
            <Button type="button" onClick={() => setFormOpen(false)}>
              신청
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <Dialog container={place}>
        <DialogTrigger asChild>
          <Button variant="neutralWeak" size="small">
            large 열기
          </Button>
        </DialogTrigger>
        <DialogContent title="설정" size="large">
          <DialogBody>크기 large 는 800 폭이에요.</DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 크기(medium · large) × 끝 흐림 × 상태(스크롤 · 누름 · 초점), 직접 열어 보기 */
export const DialogDemo = () => (
  <div className="flex flex-col gap-x6 overflow-x-auto">
    <DemoBlock title="쓰임 — 입력 폼(바닥 취소 · 저장, 머리 닫기 없음) · 조회(머리 닫기 버튼, 끝 흐림)">
      <DemoRow label="입력 폼">
        <Form />
      </DemoRow>
      <DemoRow label="조회">
        <View />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="크기 — medium 480(기본) · large 800">
      <DemoRow label="medium">
        <View fog="off" />
      </DemoRow>
      <DemoRow label="large">
        <View size="large" fog="off" />
      </DemoRow>
      <DemoRow label="large 폼">
        <Form size="large" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="끝 흐림 — 넘칠 수 있는 본문 · 위 20 · 아래 80 이 늘 흐리다">
      <DemoRow label="large fog">
        <View size="large" fog="on" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="상태 — 본문이 위로 스크롤되면 머리 아래 1px 선 · 닫기 버튼 누름 · 키보드 초점">
      <DemoRow label="scrolled">
        <View fog="off" state="scrolled" />
      </DemoRow>
      <DemoRow label="pressed">
        <View fog="off" state="pressed" />
      </DemoRow>
      <DemoRow label="focused">
        <View fog="off" state="focused" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 폼은 바깥 누르기로 안 닫히고 값이 있으면 묻는다 · 창 폭 1280 에서 시트로 바뀐다">
      <DemoRow label="대화상자">
        <Try />
      </DemoRow>
    </DemoBlock>
  </div>
);
