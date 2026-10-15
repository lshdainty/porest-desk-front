import { useState } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow } from "@/shared/ds/catalog/DemoKit";
import { OverlayStage } from "@/shared/ds/overlay/overlay-stage";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

type Layout = "horizontal" | "vertical" | "single";

// 무대 — 확인창 최대 272 + 좌우 32 = 336. 폰 폭(360)에 들어간다
const STAGE = { width: 336, height: 236 };

const COPY = {
  horizontal: {
    title: "거래를 삭제할까요?",
    description: "삭제한 거래는 되돌릴 수 없어요.",
    cancel: "취소",
    action: "삭제",
  },
  // 한쪽 글이 반 폭을 넘으면 세로로 쌓고 확정이 위
  vertical: {
    title: "작성한 내용이 사라져요",
    description: "나가면 입력한 금액과 날짜가 저장되지 않아요.",
    cancel: "계속 작성하기",
    action: "저장하지 않고 나가기",
  },
  single: {
    title: "이미 정산된 거래예요",
    description: "정산이 끝난 거래는 수정할 수 없어요.",
    cancel: "",
    action: "거래 보기",
  },
} as const;

function Alert({
  layout,
  state = "enabled",
}: {
  layout: Layout;
  state?: "enabled" | "focused";
}) {
  const copy = COPY[layout];
  return (
    <OverlayStage
      spec="alert-dialog"
      combo={{ layout }}
      state={state}
      {...STAGE}
      focusTarget="[data-slot=alert-dialog-action]"
    >
      {(container) => (
        <AlertDialog open modal={false} container={container}>
          <AlertDialogContent>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.description}</AlertDialogDescription>
            <AlertDialogFooter>
              {layout !== "single" && (
                <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
              )}
              <AlertDialogAction
                variant={layout === "single" ? "neutralSolid" : "criticalSolid"}
              >
                {copy.action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </OverlayStage>
  );
}

/** 직접 열어 보기 — 진짜 모달이다(딤 · 초점 가둠 · Esc = 취소 · 바깥 누르기는 무시). 다크 판에서도 그 판의 색으로 뜨게 판 안의 자리로 띄운다 */
function TryAlert() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const [log, setLog] = useState("아직 아무것도 고르지 않았어요");
  return (
    <div ref={setPlace} className="flex flex-col gap-x2">
      <AlertDialog container={place} onOpenChange={() => setLog("닫았어요")}>
        <AlertDialogTrigger asChild>
          <Button variant="neutralWeak" size="small">
            거래 삭제 열기
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>거래를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제한 거래는 되돌릴 수 없어요.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="criticalSolid"
              onClick={() => setLog("삭제했어요")}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-t3 text-fg-neutral-muted">{log}</p>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 배치(나란히 · 세로 · 하나) · 키보드 초점 · 직접 열어 보기 */
export const AlertDialogDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="배치 — 나란히(기본) · 글이 길면 세로(확정이 위) · 알리기는 버튼 하나">
      <DemoRow label="horizontal">
        <Alert layout="horizontal" />
      </DemoRow>
      <DemoRow label="vertical">
        <Alert layout="vertical" />
      </DemoRow>
      <DemoRow label="single">
        <Alert layout="single" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="키보드 초점 — 버튼의 링 2px · 띄움 2px(확인창 자체는 링이 없다)">
      <DemoRow label="focused">
        <Alert layout="horizontal" state="focused" />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 딤 · 초점 가둠 · Esc 는 취소 · 바깥 누르기는 무시">
      <DemoRow label="거래 삭제">
        <TryAlert />
      </DemoRow>
    </DemoBlock>
  </div>
);
