import { useState } from "react";
import {
  Copy,
  LogOut,
  EllipsisVertical,
  ExternalLink,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow } from "@/shared/ds/catalog/DemoKit";
import { OverlayStage } from "@/shared/ds/overlay/overlay-stage";

import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuTrigger,
} from "./menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuGroup,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "./responsive-menu";

// 무대 — 트리거는 오른쪽 위, 메뉴는 그 아래 8 에 오른쪽 끝을 맞춰 선다
const STAGE = { width: 320, height: 330 };

type Tone = "neutral" | "critical";
type State = "enabled" | "hovered" | "pressed" | "focused" | "disabled";

/**
 * 견본 하나 — 톤 · 상태에 맞는 줄만 담는다(검사기는 첫 줄을 잰다). 호버 · 누름은 첫 줄을 올리고 누르고(pressTarget),
 * 키보드 초점은 첫 줄로 넘긴다. suffix 면 앞 아이콘 대신 뒤 아이콘을 둔 줄(둘을 함께 두지 않는다).
 * 뒤집기 · 밀기는 끈다 — 무대 밖으로 나가 다른 견본을 덮지 않게.
 */
function Sheet({
  tone = "neutral",
  state = "enabled",
  suffix = false,
}: {
  tone?: Tone;
  state?: State;
  suffix?: boolean;
}) {
  const disabled = state === "disabled";
  const critical = tone === "critical";
  return (
    <OverlayStage
      spec="menu"
      combo={{ tone }}
      state={state}
      {...STAGE}
      pressTarget={
        state === "hovered" || state === "pressed"
          ? "[data-slot=menu-item]"
          : undefined
      }
      focusTarget="[data-slot=menu-item]"
    >
      {(container) => (
        <Menu open>
          <div className="absolute right-x3 top-x3">
            <MenuTrigger asChild>
              <Button
                variant="ghost"
                ghostColor="neutralSubtle"
                layout="iconOnly"
                aria-label="주간 회의 메모 더보기"
              >
                <EllipsisVertical aria-hidden />
              </Button>
            </MenuTrigger>
          </div>
          <MenuContent container={container} avoidCollisions={false}>
            {suffix ? (
              <MenuGroup>
                <MenuItem
                  label={critical ? "연결 끊기" : "도움말"}
                  tone={tone}
                  disabled={disabled}
                  suffixIcon={<ExternalLink />}
                />
                <MenuItem
                  label="설정"
                  tone={tone}
                  disabled={disabled}
                  suffixIcon={<ExternalLink />}
                />
              </MenuGroup>
            ) : critical ? (
              <MenuGroup>
                <MenuItem
                  icon={<Trash2 />}
                  label="삭제"
                  tone="critical"
                  disabled={disabled}
                />
                <MenuItem
                  icon={<LogOut />}
                  label="나가기"
                  description="되돌릴 수 없어요."
                  tone="critical"
                  disabled={disabled}
                />
              </MenuGroup>
            ) : (
              <>
                <MenuGroup>
                  <MenuGroupLabel>메모</MenuGroupLabel>
                  <MenuItem icon={<Pin />} label="고정" disabled={disabled} />
                  <MenuItem
                    icon={<Pencil />}
                    label="수정"
                    description="내용을 고쳐요."
                    disabled={disabled}
                  />
                </MenuGroup>
                {!disabled && (
                  <MenuGroup>
                    <MenuItem icon={<Trash2 />} label="삭제" tone="critical" />
                  </MenuGroup>
                )}
              </>
            )}
          </MenuContent>
        </Menu>
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

/** 직접 열어 보는 ⋮ — Menu 를 바로 쓴다(늘 1280 이상인 자리). 고른 줄은 메뉴가 다 닫힌 뒤 실행된다 */
function TryMenu() {
  const [last, setLast] = useState("아직 고르지 않았어요");
  return (
    <div className="flex items-center gap-x3">
      <Menu>
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            ghostColor="neutralSubtle"
            layout="iconOnly"
            aria-label="김하늘 더보기"
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuGroup>
            <MenuItem label="수정" onSelect={() => setLast("수정")} />
            <MenuItem
              label="비밀번호 초기화"
              description="새 비밀번호를 메일로 보내요."
              onSelect={() => setLast("비밀번호 초기화")}
            />
            <MenuItem
              label="휴가 내역 내보내기"
              disabled
              onSelect={() => setLast("휴가 내역 내보내기")}
            />
          </MenuGroup>
          <MenuGroup>
            <MenuItem
              label="삭제"
              tone="critical"
              onSelect={() => setLast("삭제")}
            />
          </MenuGroup>
        </MenuContent>
      </Menu>
      <span className="text-t3 text-fg-neutral-muted">고른 것: {last}</span>
    </div>
  );
}

/** 폭을 보고 1280 이상은 Menu · 미만은 Menu Sheet 로 — 같은 줄 · 같은 순서 · 같은 막힘 */
function TryResponsive() {
  const [last, setLast] = useState("아직 고르지 않았어요");
  return (
    <div className="flex items-center gap-x3">
      <ResponsiveMenu>
        <ResponsiveMenuTrigger asChild>
          <Button
            variant="ghost"
            ghostColor="neutralSubtle"
            layout="iconOnly"
            aria-label="주간 회의 메모 더보기"
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </ResponsiveMenuTrigger>
        {/* title — Menu Sheet 의 제목(1280 이상 메뉴에는 머리가 없다) */}
        <ResponsiveMenuContent title="주간 회의 메모">
          <ResponsiveMenuGroup>
            <ResponsiveMenuItem
              icon={<Pin />}
              label="고정"
              onSelect={() => setLast("고정")}
            />
            <ResponsiveMenuItem
              icon={<Pencil />}
              label="수정"
              onSelect={() => setLast("수정")}
            />
            <ResponsiveMenuItem
              icon={<Copy />}
              label="복사해 새로 쓰기"
              onSelect={() => setLast("복사해 새로 쓰기")}
            />
          </ResponsiveMenuGroup>
          <ResponsiveMenuGroup>
            <ResponsiveMenuItem
              icon={<Trash2 />}
              label="삭제"
              tone="critical"
              onSelect={() => setLast("삭제")}
            />
          </ResponsiveMenuGroup>
        </ResponsiveMenuContent>
      </ResponsiveMenu>
      <span className="text-t3 text-fg-neutral-muted">고른 것: {last}</span>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 톤 × 상태, 뒤 아이콘, 직접 열어 보기(Menu · ResponsiveMenu) */
export const MenuDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="메뉴 — 폭 200 · 모서리 20 · 줄 39(설명이 있으면 57) · 묶음 사이에만 선 · 평소 · 올림 · 누름 · 키보드 초점 · 막힌 줄">
      {STATES.map((state) => (
        <DemoRow key={state} label={state}>
          <Sheet state={state} />
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="위험한 동작 — 이름 · 아이콘만 빨강, 설명은 그대로">
      {STATES.map((state) => (
        <DemoRow key={state} label={state}>
          <Sheet tone="critical" state={state} />
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="뒤 아이콘 — 바깥 링크처럼 방향을 알릴 때만(앞 아이콘과 함께 두지 않는다)">
      <DemoRow label="neutral">
        <Sheet suffix />
      </DemoRow>
      <DemoRow label="critical">
        <Sheet tone="critical" suffix />
      </DemoRow>
      <DemoRow label="disabled">
        <Sheet state="disabled" suffix />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 누르기 · ↑ ↓ Home End · 글자 · Enter · Esc · Tab · 바깥 누르기">
      <DemoRow label="Menu ⋮">
        <TryMenu />
      </DemoRow>
      <DemoRow label="ResponsiveMenu">
        <TryResponsive />
      </DemoRow>
    </DemoBlock>
  </div>
);
