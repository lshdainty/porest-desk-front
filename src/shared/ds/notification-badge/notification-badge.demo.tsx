import type { ReactNode } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { NotificationBadge } from "./notification-badge";

// 숫자 — 한 자리 18 × 18, 두 자리 약 22, 100 이상은 "99+"(약 32)
const COUNTS = [1, 12, 128] as const;

// 24 아이콘 상자를 점선으로 보인다 — 점 · 숫자의 자리를 재는 기준(데모 덧칠). 숫자 알약이 오른쪽으로 튀어나와 뒤를 띄운다
const IconBox = ({ children }: { children: ReactNode }) => (
  <div className="mr-x6 inline-flex text-fg-neutral outline-1 outline-dashed outline-fg-disabled">
    {children}
  </div>
);

// 탭 글처럼 — 글 줄 상자에 붙는다
const TextBox = ({ children }: { children: ReactNode }) => (
  <div className="mr-x8 text-t5 font-medium text-fg-neutral">{children}</div>
);

/** 카탈로그(/dev/ds) — 크기(점 · 숫자) × 붙는 자리(아이콘 · 글), 0 · 99+, 아이콘 버튼 안. 상태는 enabled 하나다 */
export const NotificationBadgeDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="아이콘에 붙을 때 — 점선이 24 아이콘 상자. 점은 위 1 · 오른쪽 1, 숫자는 왼쪽 아래 꼭짓점이 (16, 14)">
      <DemoRow label="small · 점 6">
        <IconBox>
          <Specimen
            spec="notification-badge"
            combo={{ size: "small", attach: "icon" }}
          >
            <NotificationBadge>
              <Bell aria-hidden />
            </NotificationBadge>
          </Specimen>
        </IconBox>
      </DemoRow>
      <DemoRow label="large · 1 · 12 · 128">
        {COUNTS.map((count) => (
          <IconBox key={count}>
            <Specimen
              spec="notification-badge"
              combo={{ size: "large", attach: "icon" }}
            >
              <NotificationBadge size="large" count={count}>
                <Bell aria-hidden />
              </NotificationBadge>
            </Specimen>
          </IconBox>
        ))}
      </DemoRow>
      <DemoRow label="0 · 보고 나면 없음">
        <IconBox>
          <NotificationBadge size="large" count={0}>
            <Bell aria-hidden />
          </NotificationBadge>
        </IconBox>
        <IconBox>
          <NotificationBadge visible={false}>
            <Bell aria-hidden />
          </NotificationBadge>
        </IconBox>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="글에 붙을 때 — 마지막 글자 뒤 2 · 글 줄 상자의 위 끝. 탭 · 칸 폭과 줄 높이를 바꾸지 않는다">
      <DemoRow label="small · large">
        <TextBox>
          <Specimen
            spec="notification-badge"
            combo={{ size: "small", attach: "text" }}
          >
            <NotificationBadge attach="text">공지</NotificationBadge>
          </Specimen>
        </TextBox>
        <TextBox>
          <Specimen
            spec="notification-badge"
            combo={{ size: "large", attach: "text" }}
          >
            <NotificationBadge attach="text" size="large" count={2}>
              받은 결재
            </NotificationBadge>
          </Specimen>
        </TextBox>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="아이콘 버튼 안 — Button ghost · 아이콘만(아이콘 18). 점 · 숫자는 숨기고 버튼 이름에 넣는다">
      <DemoRow label="점">
        <Button
          variant="ghost"
          layout="iconOnly"
          aria-label="알림, 새 알림 있음"
        >
          <NotificationBadge>
            <Bell aria-hidden />
          </NotificationBadge>
        </Button>
        <Button variant="ghost" layout="iconOnly" aria-label="알림">
          <NotificationBadge visible={false}>
            <Bell aria-hidden />
          </NotificationBadge>
        </Button>
      </DemoRow>
      <DemoRow label="숫자">
        <Button
          variant="ghost"
          layout="iconOnly"
          aria-label="알림, 새 알림 3개"
        >
          <NotificationBadge size="large" count={3}>
            <Bell aria-hidden />
          </NotificationBadge>
        </Button>
        <Button
          variant="ghost"
          layout="iconOnly"
          aria-label="알림, 새 알림 128개"
        >
          <NotificationBadge size="large" count={128}>
            <Bell aria-hidden />
          </NotificationBadge>
        </Button>
      </DemoRow>
    </DemoBlock>
  </div>
);
