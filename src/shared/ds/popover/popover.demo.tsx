import { useState } from "react";
import { Info } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
} from "./popover";

const LEAVE = {
  title: "연차 사용 규정",
  description: "입사 후 연차가 생기는 방식이에요.",
};
const LEAVE_BODY =
  "입사 1년 미만은 한 달에 1일씩 생기고, 1년이 지나면 15일이 생겨요.";
const OPTIONS = ["오전 반차", "오후 반차", "연차", "병가"];

// 검사기가 견본 자리에 준 초점을 닫기 버튼으로 넘긴다(머리가 있는 팝오버의 첫 Tab 자리)
function passFocus(place: HTMLElement) {
  place
    .querySelector<HTMLElement>("[data-slot=popover-close]")
    ?.focus({ preventScroll: true });
}

/**
 * 늘 열린 팝오버 견본 — 트리거 아래에 뜬다. 표면은 견본 안의 자리(container)로 띄운다 — body 에 뜨면 다크 판의 색을 받지 못하고
 * 검사기가 견본 안에서 찾지 못한다. 견본의 첫 요소는 그 자리다(표면은 Radix 가 감싼 div 안이라 첫 요소가 될 수 없다).
 * 뒤집기 · 밀기는 끈다 — 화면을 굴려도 표면이 무대 밖으로 나가 다른 견본을 덮지 않게. 열 때 초점을 옮기지도 않는다(견본마다 초점을
 * 훔치지 않게). 제어하는 open 이라 바깥을 눌러도 닫히지 않는다.
 */
function OpenPopover({
  state = "enabled",
  label,
  title,
  description,
  ariaLabel,
  footer = false,
  children,
}: {
  state?: "enabled" | "focused";
  label: string;
  title?: string;
  description?: string;
  ariaLabel?: string;
  footer?: boolean;
  children: React.ReactNode;
}) {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const focused = state === "focused";
  return (
    <div className="w-[360px]">
      <Popover open>
        <div className="flex h-[40px] items-start justify-center">
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label={label}
            >
              <Info aria-hidden />
            </Button>
          </PopoverTrigger>
        </div>
        <Specimen spec="popover" combo={{}} state={state}>
          <div
            ref={setPlace}
            tabIndex={focused ? -1 : undefined}
            onFocus={(e) => {
              if (focused && e.target === e.currentTarget)
                passFocus(e.currentTarget);
            }}
          />
        </Specimen>
        <div className="h-[230px]" aria-hidden />
        {place && (
          <PopoverContent
            container={place}
            avoidCollisions={false}
            title={title}
            description={description}
            aria-label={ariaLabel}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <PopoverBody>{children}</PopoverBody>
            {footer && (
              <PopoverFooter>
                <Button variant="neutralWeak">취소</Button>
                <Button variant="brandSolid">완료</Button>
              </PopoverFooter>
            )}
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

/** 직접 눌러 여는 ⓘ — 처음엔 닫혀 있다. 열리면 판 안의 자리로 띄운다(다크 판의 색) */
function TryInfo() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  return (
    <div className="w-[360px]">
      <Popover>
        <div className="flex h-[40px] items-center gap-x1 text-t5 font-medium text-fg-neutral">
          <span>남은 연차 8.5일</span>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label="연차 사용 규정"
            >
              <Info aria-hidden />
            </Button>
          </PopoverTrigger>
        </div>
        <div ref={setPlace} />
        <Button variant="neutralOutline" size="small">
          다음 칸 — 마지막 칸에서 Tab
        </Button>
        {place && (
          <PopoverContent container={place} {...LEAVE}>
            <PopoverBody>{LEAVE_BODY}</PopoverBody>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

/** 고르는 패널 — 머리 없이 본문 + 바닥 "완료". 고른 것을 넣고 닫는다 */
function TryPicker() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(OPTIONS[0]);
  const [value, setValue] = useState(OPTIONS[0]);
  return (
    <div className="w-[360px]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="neutralOutline" size="small">
            휴가 종류 · {value}
          </Button>
        </PopoverTrigger>
        <div ref={setPlace} />
        {place && (
          <PopoverContent container={place} aria-label="휴가 종류 고르기">
            <PopoverBody>
              <fieldset className="m-0 flex flex-col gap-x2 border-0 p-0">
                {OPTIONS.map((o) => (
                  <label
                    key={o}
                    className="flex items-center gap-x2 text-t5 text-fg-neutral"
                  >
                    <input
                      type="radio"
                      name="popover-demo-kind"
                      checked={draft === o}
                      onChange={() => setDraft(o)}
                    />
                    {o}
                  </label>
                ))}
              </fieldset>
            </PopoverBody>
            <PopoverFooter>
              <Button
                variant="brandSolid"
                onClick={() => {
                  setValue(draft);
                  setOpen(false);
                }}
              >
                완료
              </Button>
            </PopoverFooter>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

/** 넘치는 본문 — 이 안에서 스크롤, 끝 흐림 · 위로 스크롤하면 머리 아래 선 */
function TryLong() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  return (
    <div className="w-[360px]">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="neutralOutline" size="small">
            긴 안내 열기
          </Button>
        </PopoverTrigger>
        <div ref={setPlace} />
        {place && (
          <PopoverContent
            container={place}
            title="연차 사용 규정"
            className="max-h-[260px]"
          >
            <PopoverBody scrollFog>
              {Array.from({ length: 12 }, (_, i) => (
                <p key={i} className="m-0 mb-x3 text-t4 text-fg-neutral-muted">
                  {i + 1}. 입사 1년 미만은 한 달에 1일씩 생기고, 1년이 지나면
                  15일이 생겨요.
                </p>
              ))}
            </PopoverBody>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 안내(머리 + 본문) · 바닥 · 머리 없는 고르는 패널, 키보드 초점, 직접 열어 보기 */
export const PopoverDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="표면 — 트리거와 8, 폭 320 ~ 480 · 모서리 20 · 그림자 s3 · 머리는 있을 때 제목 + 닫기">
      <DemoRow label="안내 — 머리 + 본문">
        <OpenPopover label="연차 사용 규정" {...LEAVE}>
          {LEAVE_BODY}
        </OpenPopover>
      </DemoRow>
      <DemoRow label="바닥 버튼">
        <OpenPopover label="휴가 종류" title="휴가 종류" footer>
          고른 종류를 신청서에 넣어요.
        </OpenPopover>
      </DemoRow>
      <DemoRow label="머리 없음 — 고르는 패널">
        <OpenPopover label="휴가 종류" ariaLabel="휴가 종류 고르기">
          오전 반차 · 오후 반차 · 연차
        </OpenPopover>
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="키보드 초점 — 닫기 버튼 밖 2px 링">
      <DemoRow label="닫기 버튼">
        <OpenPopover label="연차 사용 규정" state="focused" {...LEAVE}>
          {LEAVE_BODY}
        </OpenPopover>
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 누르기 · Tab 으로 들어가고 나가기(마지막 칸에서 닫힘) · Esc · 바깥 누르기">
      <DemoRow label="ⓘ 규정 안내">
        <TryInfo />
      </DemoRow>
      <DemoRow label="고르는 패널">
        <TryPicker />
      </DemoRow>
      <DemoRow label="넘치는 본문">
        <TryLong />
      </DemoRow>
    </DemoBlock>
  </div>
);
