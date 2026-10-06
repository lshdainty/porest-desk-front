import type { ReactNode } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Avatar, AvatarStack, type AvatarSize } from "./avatar";
import { avatarHue } from "./avatar-variants";

const SIZES: AvatarSize[] = [20, 24, 36, 42, 48, 56, 64, 80, 96, 108];
// 제주 여행 더치페이 참가자 — 6명(앞 4명 + "+2")
const PEOPLE = ["김민수", "이서연", "박지훈", "최유진", "정하늘", "한지우"];
// 이름 색 열 가지 — 나머지 0 ~ 9 가 하나씩 나오는 이름
const HUE_NAMES = [
  "김민수",
  "박지훈",
  "한지우",
  "강도윤",
  "윤재현",
  "Kim Minsu",
  "권나래",
  "정하늘",
  "이서연",
  "유승우",
];

// 사진 자리 — 사람 사진처럼 칠한 그림(실제 사람 · 사진이 아니다). porest-design avatar-examples.mjs 의 photo() 와 같다
const photo = ([a, b, hair]: readonly [string, string, string]) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="48" cy="40" r="18" fill="#f1d5bd"/><path d="M29 37c0-13 9-20 19-20s19 7 19 20c-4-4-10-6-19-6s-15 2-19 6Z" fill="${hair}"/><path d="M12 96c0-21 16-35 36-35s36 14 36 35Z" fill="#f4f4f4"/></svg>`,
  )}`;
const PHOTOS = [
  photo(["#b9c9d9", "#7d8fa3", "#3d342e"]),
  photo(["#e3c9b0", "#c19a7a", "#2b2320"]),
  photo(["#cfd8c8", "#94a38b", "#4a3a2c"]),
] as const;
// 못 불러오는 사진 — 이니셜이 그대로 남는다
const BROKEN = "data:image/png;base64,AAAA";

// 견본 아래 이름표(데모 덧칠)
const Labeled = ({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-x1_5">
    {children}
    <span className="text-t2 text-fg-neutral-subtle">{caption}</span>
  </div>
);

/** 카탈로그(/dev/ds) — 크기 10단계(이니셜 · 사진), 사진 상태, 이름 색 열 가지, 이름, 묶음. 상태는 enabled 하나다 */
export const AvatarDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 10단계 — 이니셜은 지름의 40%(가장 작아도 10) · 700 · 줄 높이 1, 1px 안쪽 투명 테두리">
      <DemoRow label="이니셜">
        {SIZES.map((size) => (
          <Labeled key={size} caption={String(size)}>
            <Specimen spec="avatar" combo={{ size: String(size) }}>
              <Avatar size={size} name="김민수" />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
      <DemoRow label="사진">
        {SIZES.map((size, i) => (
          <Labeled key={size} caption={String(size)}>
            <Specimen spec="avatar" combo={{ size: String(size) }}>
              <Avatar
                size={size}
                name="윤재현"
                src={PHOTOS[i % PHOTOS.length]}
              />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="사진 · 이니셜 — 사진이 없거나 불러오는 동안 · 못 불러오면 이니셜(깨진 그림 · 빈 원이 없다)">
      <DemoRow label="48">
        <Labeled caption="사진">
          <Specimen spec="avatar" combo={{ size: "48" }}>
            <Avatar name="서다은" src={PHOTOS[1]} />
          </Specimen>
        </Labeled>
        <Labeled caption="못 불러옴">
          <Specimen spec="avatar" combo={{ size: "48" }}>
            <Avatar name="서다은" src={BROKEN} />
          </Specimen>
        </Labeled>
        <Labeled caption="사진 없음">
          <Specimen spec="avatar" combo={{ size: "48" }}>
            <Avatar name="서다은" />
          </Specimen>
        </Labeled>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="이름 색 — 코드 포인트 합 % 10 → 차트 10색(blue · green · orange · violet · pink · indigo · red · yellow · brown · gray)">
      <DemoRow label="42">
        {HUE_NAMES.map((name) => (
          <Labeled key={name} caption={`${name} · ${avatarHue(name)}`}>
            <Specimen spec="avatar" combo={{ size: "42" }}>
              <Avatar size={42} name={name} />
            </Specimen>
          </Labeled>
        ))}
        <Labeled caption="이름 없음 · gray">
          <Specimen spec="avatar" combo={{ size: "42" }}>
            <Avatar size={42} name="" />
          </Specimen>
        </Labeled>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="이름 — 옆에 이름이 있으면 장식(숨김), 혼자면 role=img + 이름">
      <DemoRow label="이름 옆 · 36">
        {["김민수", "이서연"].map((name) => (
          <span
            key={name}
            className="flex items-center gap-x3 text-t5 text-fg-neutral"
          >
            <Avatar size={36} name={name} />
            {name}
          </span>
        ))}
      </DemoRow>
      <DemoRow label="혼자 · 36 · 96">
        <Avatar size={36} name="김민수" decorative={false} />
        <Avatar size={96} name="서다은" src={PHOTOS[1]} decorative={false} />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="묶음 — 지름의 1/4 겹침 · 놓인 바탕색 링 · 뒤가 위, 앞 4명 + “+N”">
      {SIZES.map((size) => (
        <DemoRow key={size} label={String(size)}>
          <Specimen spec="avatar-stack" combo={{ size: String(size) }}>
            <AvatarStack size={size}>
              {PEOPLE.map((name) => (
                <Avatar key={name} name={name} />
              ))}
            </AvatarStack>
          </Specimen>
        </DemoRow>
      ))}
      <DemoRow label="4명 · +99">
        <Specimen spec="avatar-stack" combo={{ size: "36" }}>
          <AvatarStack size={36}>
            {PEOPLE.slice(0, 4).map((name) => (
              <Avatar key={name} name={name} />
            ))}
          </AvatarStack>
        </Specimen>
        <Specimen spec="avatar-stack" combo={{ size: "36" }}>
          <AvatarStack size={36}>
            {Array.from({ length: 128 }, (_, i) => (
              <Avatar key={i} name={PEOPLE[i % PEOPLE.length] ?? ""} />
            ))}
          </AvatarStack>
        </Specimen>
      </DemoRow>
      <DemoRow label="옆에 수 · 이름">
        <span className="flex items-center gap-x2 text-t3 text-fg-neutral-subtle">
          <AvatarStack size={24}>
            {PEOPLE.map((name) => (
              <Avatar key={name} name={name} src={null} />
            ))}
          </AvatarStack>
          6명 · 412,000원
        </span>
        <AvatarStack
          size={24}
          aria-label="참여자 6명: 김민수, 이서연, 박지훈, 최유진 외 2명"
        >
          {PEOPLE.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarStack>
      </DemoRow>
      <DemoRow label="시트 안(floating)">
        <div className="rounded-r2 bg-bg-layer-floating p-x3">
          <AvatarStack size={36} surface="floating">
            {PEOPLE.map((name) => (
              <Avatar key={name} name={name} />
            ))}
          </AvatarStack>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
