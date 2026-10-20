import { useState, type FocusEvent, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Bell,
  Car,
  ChevronRight,
  Coffee,
  CreditCard,
  EllipsisVertical,
  Globe,
  Info,
  Landmark,
  Lock,
  Mail,
  ShoppingBag,
  Tag,
  User,
  Utensils,
} from "lucide-react";

import { Avatar } from "@/shared/ds/avatar";
import { Badge } from "@/shared/ds/badge";
import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { TagGroup, TagGroupItem } from "@/shared/ds/tag-group";

import {
  List,
  ListButtonItem,
  ListCheckGroup,
  ListCheckItem,
  ListDivider,
  ListHeader,
  ListItem,
  ListLinkItem,
  ListParentItem,
  ListRadioGroup,
  ListRadioItem,
  ListSwitchItem,
  ListTile,
} from "./list";

// 카테고리 색 타일 — 옅은 바탕(chart-{색}-weak) + 아이콘 색(chart-{색}). 이체 줄은 회색(카테고리가 아니라 돈의 이동)
const TILE = {
  orange: "bg-chart-orange-weak text-chart-orange",
  blue: "bg-chart-blue-weak text-chart-blue",
  green: "bg-chart-green-weak text-chart-green",
  violet: "bg-chart-violet-weak text-chart-violet",
  pink: "bg-chart-pink-weak text-chart-pink",
  gray: "bg-chart-gray-weak text-chart-gray",
} as const;

const Tile = ({
  color,
  children,
}: {
  color: keyof typeof TILE;
  children: ReactNode;
}) => <ListTile className={TILE[color]}>{children}</ListTile>;

// 링크는 견본 안에서 어디로도 가지 않는다 — 검사기가 눌렀다 떼면 클릭이 되어 페이지가 바뀐다
const stay = (e: { preventDefault: () => void }) => e.preventDefault();
const noop = () => {};

// 폰 폭 칸 — 줄은 24 가장자리 여백이라 폭이 그림의 일부다
const Cell = ({
  children,
  width = 360,
}: {
  children: ReactNode;
  width?: number;
}) => (
  <div className="shrink-0 rounded-r2 bg-bg-layer-default" style={{ width }}>
    {children}
  </div>
);

// 검사기가 견본 뿌리에 준 키보드 포커스를 줄의 본문으로 넘긴다 — 뿌리(목록)는 초점을 받지 않는다(Checkbox 데모의 passFocus 와 같은 방법,
// 컴포넌트는 그대로다). 컨트롤 줄은 끼운 컨트롤이, 부모 줄은 selector 로 고른 것(본문 · 꺾쇠 단추)이 받는다
const passFocus = (selector = "[data-slot=list-body]") => ({
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget
      .querySelector<HTMLElement>(selector)
      ?.focus({ preventScroll: true });
  },
});

// ── 줄의 종류 ───────────────────────────────────────────────

const KindsDemo = () => {
  const [currency, setCurrency] = useState("KRW");
  return (
    <DemoBlock title="줄의 종류 — 보기만 하는 줄 · 누르는 줄 · 링크 줄 · 컨트롤 줄(스위치 · 체크 · 라디오). 누르는 줄만 호버 · 누름 · 포커스를 가진다">
      <DemoRow label="보기만 하는 줄">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="계정 정보">
              <ListItem title="가입일" suffix="2026년 3월 2일" />
              <ListItem title="이메일" suffix="groo@example.com" />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="누르는 줄">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="설정 · 누르는 줄">
              <ListButtonItem
                prefix={<User />}
                title="계정"
                suffix={<ChevronRight />}
                onClick={noop}
              />
              <ListButtonItem
                prefix={<Globe />}
                title="기본 통화"
                suffix={
                  <>
                    대한민국 원
                    <ChevronRight />
                  </>
                }
                onClick={noop}
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="링크 줄">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="도움말 · 링크 줄">
              <ListLinkItem
                href="https://example.com/help"
                onClick={stay}
                prefix={<Info />}
                title="도움말"
                detail="설명서에서 자세히 알아보세요"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="스위치 줄">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="알림 · 스위치 줄">
              <ListSwitchItem
                prefix={<Bell />}
                title="결제 알림"
                detail="결제 예정일 D-1, 결제일 당일 알림"
                defaultChecked
              />
              <ListSwitchItem prefix={<Mail />} title="이메일 알림" />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="체크 줄 · 여럿 고르기">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <ListCheckGroup aria-label="내보낼 항목 · 앞 체크">
              <ListCheckItem title="거래 내역" defaultChecked />
              <ListCheckItem title="예산" detail="카테고리별 한도" />
            </ListCheckGroup>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <ListCheckGroup aria-label="내보낼 항목 · 뒤 체크">
              <ListCheckItem
                markPosition="suffix"
                prefix={<CreditCard />}
                title="카드"
                defaultChecked
              />
              <ListCheckItem
                markPosition="suffix"
                prefix={<Landmark />}
                title="계좌"
              />
            </ListCheckGroup>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="라디오 줄 · 하나 고르기">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <ListRadioGroup
              aria-label="기본 통화"
              value={currency}
              onValueChange={setCurrency}
            >
              <ListRadioItem value="KRW" title="대한민국 원" detail="KRW" />
              <ListRadioItem value="USD" title="미국 달러" detail="USD" />
              <ListRadioItem value="JPY" title="일본 엔" detail="JPY" />
            </ListRadioGroup>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <ListRadioGroup
              aria-label="공개 범위 · 앞 라디오"
              defaultValue="me"
            >
              <ListRadioItem
                markPosition="prefix"
                value="me"
                title="나만 보기"
              />
              <ListRadioItem
                markPosition="prefix"
                value="family"
                title="가족과 함께"
              />
            </ListRadioGroup>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>
  );
};

// ── 앞 붙이개 · 뒤 붙이개 · 설명 ─────────────────────────────

const PrefixDemo = () => (
  <>
    <DemoBlock title="앞 붙이개 — 설정 · 메뉴는 아이콘 22 · 내용 줄은 타일 40(모서리 12, 아이콘 20) · 물건 줄은 로고 타일 40 · 카드 그림 56 · 아바타 · 체크 · 라디오. 한 목록 안에서 섞지 않는다">
      <DemoRow label="아이콘 22">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="설정">
              <ListButtonItem prefix={<Lock />} title="비밀번호" />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="타일 40 · 거래">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="거래 · 타일">
              <ListButtonItem
                prefix={
                  <Tile color="orange">
                    <Utensils />
                  </Tile>
                }
                title="점심 · 김치찌개"
                detail="식비"
                suffix={<b className="font-bold text-fg-neutral">-9,000원</b>}
              />
              <ListButtonItem
                prefix={
                  <Tile color="blue">
                    <Car />
                  </Tile>
                }
                title="주유"
                detail="교통"
                suffix={<b className="font-bold text-fg-neutral">-62,000원</b>}
              />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="거래 · 이체와 아이콘 없는 카테고리">
              <ListButtonItem
                prefix={
                  <Tile color="gray">
                    <ArrowLeftRight />
                  </Tile>
                }
                title="월급통장 → 생활비"
                detail="이체"
                suffix={<b className="font-bold text-fg-neutral">500,000원</b>}
              />
              <ListButtonItem
                prefix={
                  <Tile color="violet">
                    <Tag />
                  </Tile>
                }
                title="기타"
                detail="아이콘이 없는 카테고리는 태그 아이콘"
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="로고 · 카드 그림">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="자산 · 로고 타일 자리">
              <ListButtonItem
                prefix={
                  // 로고 타일(Logo Tile)은 따로 만든다 — 같은 40 · 모서리 12 의 자리만(기관 색 + 첫 글자)
                  <span
                    aria-hidden
                    className="inline-grid size-x10 shrink-0 place-items-center rounded-r3 bg-bg-brand-solid text-t4 font-bold text-static-white"
                  >
                    포
                  </span>
                }
                title="그루은행 입출금"
                detail="1,284,000원"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="카드 혜택 · 카드 그림 자리">
              <ListButtonItem
                prefix={
                  // 카드 그림 56(Image Frame 의 카드 그림)은 따로 만든다 — 폭 56 · 카드 비율의 자리만
                  <span
                    aria-hidden
                    className="inline-block h-9 w-14 shrink-0 rounded-r1_5 bg-bg-neutral-weak"
                  />
                }
                title="그루 체크카드"
                detail="전월 30만원 이상 · 할인형"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="아바타">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="참여자 · 한 줄 36">
              <ListButtonItem
                prefix={<Avatar name="김민수" size={36} />}
                title="김민수"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="참여자 · 두 줄 42">
              <ListButtonItem
                prefix={<Avatar name="이서연" size={42} />}
                title="이서연"
                detail="제주 여행 · 더치페이 5명"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="뒤 붙이개 — 값 글자(16 · 옅은 색) · 오른쪽 화살표 18(화면을 옮기는 줄에만) · 스위치 32 · 체크 24 · 라디오 24 · 작은 버튼 · 금액(그 화면이 정한다 — 가계부 16 · 700)">
      <DemoRow label="값 글자 · 화살표">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="값 글자">
              <ListItem title="앱 버전" suffix="1.23.1" />
              <ListButtonItem
                title="언어"
                suffix={
                  <>
                    한국어
                    <ChevronRight />
                  </>
                }
              />
              <ListButtonItem title="이용 약관" suffix={<ChevronRight />} />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="작은 버튼 · 메뉴">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="줄 안의 누르는 것은 셋까지">
              <ListButtonItem
                prefix={
                  <Tile color="green">
                    <Coffee />
                  </Tile>
                }
                title="카페 · 아메리카노"
                detail="줄 · 작은 버튼 · 메뉴 — 셋"
                suffix={
                  <>
                    <Button variant="neutralWeak" size="xsmall">
                      분류
                    </Button>
                    <Button
                      variant="ghost"
                      ghostColor="neutralSubtle"
                      layout="iconOnly"
                      size="xsmall"
                      aria-label="카페 · 아메리카노 더 보기"
                    >
                      <EllipsisVertical aria-hidden />
                    </Button>
                  </>
                }
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="설명 — 제목 아래 2 떨어져 13 · 옅은 색. 한 줄 · 두 줄까지, 그 이상이면 맞춤을 위로. 여러 메타를 잇는 설명 줄은 Tag Group(t3)">
      <DemoRow label="한 줄 · 두 줄 · 메타">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="설명">
              <ListItem title="알림 시각" detail="오전 9시" />
              <ListItem
                title="결제 알림"
                detail="결제 예정일 D-1, 결제일 당일에 알려요. 설명이 두 줄까지 이어져도 줄 높이만 늘어요"
              />
              <ListButtonItem
                prefix={
                  <Tile color="pink">
                    <ShoppingBag />
                  </Tile>
                }
                title="무신사 · 가을 코트"
                detail={
                  <TagGroup size="t3">
                    <TagGroupItem>쇼핑</TagGroupItem>
                    <TagGroupItem>그루 체크카드</TagGroupItem>
                    <TagGroupItem>10월 2일 오후 2:30</TagGroupItem>
                  </TagGroup>
                }
                suffix={<b className="font-bold text-fg-neutral">-89,000원</b>}
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>
  </>
);

// ── 맞춤 · 강조 · 합계에 안 드는 줄 ───────────────────────────

const LONG_TITLE =
  "아주 긴 제목은 낱말 단위로만 줄을 바꾸고 말줄임 없이 끝까지 보여요 — 세 줄째부터는 앞 · 뒤를 위로 맞춘다";

const AlignHighlightDemo = () => (
  <>
    <DemoBlock title="맞춤 — 기본 가운데, 제목이 두 줄을 넘거나 설명이 길면 위(한 목록 안에서는 줄마다 섞지 않는다)">
      <DemoRow label="center · top">
        <Cell>
          <Specimen spec="list" combo={{ align: "center" }}>
            <List aria-label="가운데 맞춤">
              <ListButtonItem
                prefix={<Info />}
                title="가운데 맞춤"
                detail="앞 · 뒤가 본문의 세로 가운데"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{ align: "top" }}>
            <List aria-label="위 맞춤">
              <ListButtonItem
                align="top"
                prefix={<Info />}
                title={LONG_TITLE}
                detail="설명이 길 때도 같다"
                suffix={<ChevronRight />}
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="강조 — 바탕만 옅은 브랜드 색(점 · 막대 없음). 올리거나 누르면 바탕이 짙어지고 설명 · 값 글자만 한 단계 짙다">
      <DemoRow label="안 읽은 알림">
        <Cell>
          <Specimen spec="list" combo={{ highlight: "highlighted" }}>
            <List aria-label="알림 · 안 읽음">
              <ListButtonItem
                highlighted
                prefix={
                  <Tile color="orange">
                    <Bell />
                  </Tile>
                }
                title="안 읽음 · 예산 80% 도달"
                detail="식비 예산의 80%를 썼어요"
                suffix="방금"
              />
              <ListButtonItem
                highlighted
                prefix={
                  <Tile color="blue">
                    <CreditCard />
                  </Tile>
                }
                title="안 읽음 · 카드 결제 예정"
                detail="내일 그루 체크카드 214,000원"
                suffix="1시간 전"
              />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="알림 · 읽음">
              <ListButtonItem
                prefix={
                  <Tile color="green">
                    <Car />
                  </Tile>
                }
                title="읽음 · 교통 예산 초과"
                detail="이번 달 교통 예산을 넘겼어요"
                suffix="어제"
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="합계에 안 드는 줄 — 흐리게 하지 않는다. 제목 · 금액만 fg-neutral-subtle, 환불 금액은 취소선, 배지는 보통 대비. 누름 · 호버 · 포커스는 보통 줄과 같다(막힌 줄이 아니다)">
      <DemoRow label="예정 · 환불">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="합계에 안 드는 거래">
              <ListButtonItem
                prefix={
                  <Tile color="blue">
                    <CreditCard />
                  </Tile>
                }
                title={<span className="text-fg-neutral-subtle">넷플릭스</span>}
                detail={
                  <span className="flex items-center gap-x1">
                    <Badge>예정</Badge>
                    <span>10월 20일 결제</span>
                  </span>
                }
                suffix={
                  <b className="font-bold text-fg-neutral-subtle">-17,000원</b>
                }
              />
              <ListButtonItem
                prefix={
                  <Tile color="pink">
                    <ShoppingBag />
                  </Tile>
                }
                title={<span className="text-fg-neutral-subtle">무신사</span>}
                detail={
                  <span className="flex items-center gap-x1">
                    <Badge>환불됨</Badge>
                    <span>10월 5일</span>
                  </span>
                }
                suffix={
                  <b className="font-bold text-fg-neutral-subtle line-through">
                    -89,000원
                  </b>
                }
              />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>
  </>
);

// ── 상태 ─────────────────────────────────────────────────────
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태.
// 견본은 한 줄이다(가운데가 줄이어야 검사기가 올리고 누를 수 있다) — 하나 고르기가 두 줄 이상이어야 한다는 규칙은 실제 화면의 것이다

const STATES = [
  "enabled",
  "hovered",
  "focused",
  "pressed",
  "disabled",
] as const;
type State = (typeof STATES)[number];
const KINDS = ["button", "link", "tile", "switch", "check", "radio"] as const;
type Kind = (typeof KINDS)[number];
const KIND_LABEL: Record<Kind, string> = {
  button: "누르는 줄",
  link: "링크 줄",
  tile: "누르는 줄 · 타일",
  switch: "스위치 줄",
  check: "체크 줄",
  radio: "라디오 줄",
};

const StateSample = ({
  kind,
  state,
  highlighted = false,
}: {
  kind: Kind;
  state: State;
  highlighted?: boolean;
}) => {
  const disabled = state === "disabled";
  const combo = { highlight: highlighted ? "highlighted" : "none" };
  const focus =
    state === "focused"
      ? passFocus(
          kind === "switch" || kind === "check"
            ? "[data-slot=list-mark]"
            : undefined,
        )
      : {};
  const label = `${KIND_LABEL[kind]} · ${state}`;
  let list: ReactNode;
  switch (kind) {
    case "button":
      list = (
        <List aria-label={label} {...focus}>
          <ListButtonItem
            highlighted={highlighted}
            disabled={disabled}
            prefix={<Bell />}
            title="결제 알림"
            detail="결제 예정일 D-1"
            suffix={
              <>
                대한민국 원
                <ChevronRight />
              </>
            }
            onClick={noop}
          />
        </List>
      );
      break;
    case "link":
      list = (
        <List aria-label={label} {...focus}>
          <ListLinkItem
            highlighted={highlighted}
            href="https://example.com/help"
            onClick={stay}
            prefix={<Info />}
            title="도움말"
            detail="설명서에서 자세히 알아보세요"
            suffix={<ChevronRight />}
          />
        </List>
      );
      break;
    case "tile":
      list = (
        <List aria-label={label} {...focus}>
          <ListButtonItem
            disabled={disabled}
            prefix={
              <Tile color="orange">
                <Utensils />
              </Tile>
            }
            title="점심 · 김치찌개"
            detail="식비"
            suffix={
              // 금액의 색은 그 화면이 정한다 — 막힌 줄은 값 글자와 같이 비활성 색을 따른다
              <b
                className={disabled ? "font-bold" : "font-bold text-fg-neutral"}
              >
                -9,000원
              </b>
            }
            onClick={noop}
          />
        </List>
      );
      break;
    case "switch":
      list = (
        <List aria-label={label} {...focus}>
          <ListSwitchItem
            highlighted={highlighted}
            disabled={disabled}
            prefix={<Bell />}
            title="결제 알림"
            detail="결제 예정일 D-1"
            defaultChecked
          />
        </List>
      );
      break;
    case "check":
      list = (
        <ListCheckGroup aria-label={label} {...focus}>
          <ListCheckItem
            highlighted={highlighted}
            disabled={disabled}
            title="거래 내역"
            detail="내보낼 항목"
            defaultChecked
          />
        </ListCheckGroup>
      );
      break;
    case "radio":
      list = (
        <ListRadioGroup aria-label={label} defaultValue="KRW">
          <ListRadioItem
            highlighted={highlighted}
            disabled={disabled}
            value="KRW"
            title="대한민국 원"
            detail="KRW"
          />
        </ListRadioGroup>
      );
      break;
  }
  return (
    <Cell width={300}>
      <Specimen spec="list" combo={combo} state={state}>
        {list}
      </Specimen>
    </Cell>
  );
};

const StatesDemo = () => (
  <DemoBlock title="상태 — 호버 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다). 컨트롤 줄은 끼운 컨트롤이 포커스를 받아 줄의 링은 없다. 링크 줄은 막지 않는다">
    {KINDS.map((kind) => (
      <DemoRow key={kind} label={KIND_LABEL[kind]}>
        {STATES.filter((s) => kind !== "link" || s !== "disabled").map(
          (state) => (
            <StateSample key={state} kind={kind} state={state} />
          ),
        )}
      </DemoRow>
    ))}
    <DemoRow label="강조 · 누르는 줄">
      {STATES.map((state) => (
        <StateSample key={state} kind="button" state={state} highlighted />
      ))}
    </DemoRow>
  </DemoBlock>
);

// ── 목록 제목 · 줄 사이 선 ───────────────────────────────────

const HeaderDividerDemo = () => (
  <>
    <DemoBlock title="목록 제목 — mediumWeak(기본 · 14 · 500 · 옅은 색) · boldSolid(화면을 크게 나누는 묶음 · 700 · 짙은 색). 오른쪽에 작은 버튼, 좌우 24 는 줄과 같다">
      <DemoRow label="mediumWeak">
        <Cell>
          <Specimen spec="list-header" combo={{ variant: "mediumWeak" }}>
            <ListHeader id="demo-header-general">일반</ListHeader>
          </Specimen>
          <List aria-labelledby="demo-header-general">
            <ListButtonItem prefix={<User />} title="계정" />
            <ListButtonItem prefix={<Globe />} title="기본 통화" />
          </List>
        </Cell>
        <Cell>
          <Specimen spec="list-header" combo={{ variant: "mediumWeak" }}>
            <ListHeader>
              <span id="demo-header-budget">카테고리별 예산</span>
              <Button variant="ghost" ghostColor="neutralSubtle" size="xsmall">
                전체 보기
              </Button>
            </ListHeader>
          </Specimen>
          <List aria-labelledby="demo-header-budget">
            <ListItem title="식비" suffix="240,000원" />
            <ListItem title="교통" suffix="80,000원" />
          </List>
        </Cell>
      </DemoRow>
      <DemoRow label="boldSolid">
        <Cell>
          <Specimen spec="list-header" combo={{ variant: "boldSolid" }}>
            <ListHeader variant="boldSolid" id="demo-header-bold">
              이번 달 지출
            </ListHeader>
          </Specimen>
          <List aria-labelledby="demo-header-bold">
            <ListItem title="총 지출" suffix="1,284,000원" />
          </List>
        </Cell>
        <Cell>
          <Specimen spec="list-header" combo={{ variant: "boldSolid" }}>
            <ListHeader variant="boldSolid">
              <span>자산 · 4개</span>
              <Button
                variant="ghost"
                ghostColor="neutralSubtle"
                layout="iconOnly"
                size="xsmall"
                aria-label="자산 안내"
              >
                <Info aria-hidden />
              </Button>
            </ListHeader>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="줄 사이 선(ListDivider) — 기본은 두지 않는다. 필요할 때만 1px · 줄 폭 전체, 앞 붙이개가 있으면 좌우 24 들인다">
      <DemoRow label="없음 · 줄 폭 · 들임">
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="구분선 없음">
              <ListItem title="가입일" suffix="2026년 3월 2일" />
              <ListItem title="이메일" suffix="groo@example.com" />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="구분선 · 줄 폭 전체">
              <ListItem title="가입일" suffix="2026년 3월 2일" />
              <ListDivider />
              <ListItem title="이메일" suffix="groo@example.com" />
            </List>
          </Specimen>
        </Cell>
        <Cell>
          <Specimen spec="list" combo={{}}>
            <List aria-label="구분선 · 들임">
              <ListButtonItem prefix={<User />} title="계정" />
              <ListDivider inset />
              <ListButtonItem prefix={<Globe />} title="기본 통화" />
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
    </DemoBlock>
  </>
);

// ── 하위 줄 ─────────────────────────────────────────────────

const FOOD_CHILDREN = [
  "외식",
  "배달음식",
  "카페 · 간식",
  "장보기",
  "술 · 유흥",
  "기타 식비",
];

// 하위 줄(타일은 부모 제목 아래에서 시작한다 — 104)
const Children = ({
  names,
  color,
}: {
  names: string[];
  color: keyof typeof TILE;
}) =>
  names.map((name) => (
    <ListButtonItem
      key={name}
      prefix={
        <Tile color={color}>
          <Tag />
        </Tile>
      }
      title={name}
      detail="지출"
      onClick={noop}
    />
  ));

const NestedDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <DemoBlock title="하위 줄 — 접는 부모 줄. 줄 앞 꺾쇠 단추 44(누르는 영역 = 보이는 상자 · 모서리 10 · 20 chevron-right, 펼치면 90° 300ms) · 앞 붙이개는 52 에서 시작 · 하위 줄은 부모의 제목 자리 104 · 하위가 없는 부모는 같은 폭의 빈 자리 · 이름 고정 + aria-expanded">
      <DemoRow label="카테고리 · 펼침 · 접힘">
        <Cell width={400}>
          <Specimen
            spec="list"
            combo={{ nest: "parent", expanded: "expanded" }}
          >
            <List aria-label="지출 카테고리 · 식비 펼침">
              <ListParentItem
                prefix={
                  <Tile color="orange">
                    <Utensils />
                  </Tile>
                }
                title="식비"
                detail="지출 · 하위 6개"
                expandLabel="식비 하위 카테고리"
                defaultOpen
                onClick={noop}
              >
                <Children names={FOOD_CHILDREN} color="orange" />
              </ListParentItem>
              <ListParentItem
                prefix={
                  <Tile color="gray">
                    <Tag />
                  </Tile>
                }
                title="기타"
                detail="지출 · 하위 없음"
                expandLabel="기타 하위 카테고리"
                onClick={noop}
              />
            </List>
          </Specimen>
        </Cell>
        <Cell width={400}>
          <Specimen
            spec="list"
            combo={{ nest: "parent", expanded: "collapsed" }}
          >
            <List aria-label="지출 카테고리 · 접힘">
              <ListParentItem
                prefix={
                  <Tile color="pink">
                    <ShoppingBag />
                  </Tile>
                }
                title="쇼핑"
                detail="지출 · 하위 6개(접힘)"
                expandLabel="쇼핑 하위 카테고리"
                onClick={noop}
              >
                <Children
                  names={[
                    "의류",
                    "신발 · 가방",
                    "화장품",
                    "생활용품",
                    "전자기기",
                    "기타 쇼핑",
                  ]}
                  color="pink"
                />
              </ListParentItem>
              <ListParentItem
                prefix={
                  <Tile color="blue">
                    <Car />
                  </Tile>
                }
                title="교통"
                detail="지출 · 하위 2개(접힘)"
                expandLabel="교통 하위 카테고리"
                onClick={noop}
              >
                <Children names={["대중교통", "택시"]} color="blue" />
              </ListParentItem>
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="하위 줄 · 들임 104">
        <Cell width={400}>
          <Specimen spec="list" combo={{ nest: "child", expanded: "expanded" }}>
            <List data-measure="child" aria-label="하위 줄 · 들임">
              <ListParentItem
                prefix={
                  <Tile color="green">
                    <Coffee />
                  </Tile>
                }
                title="카페"
                expandLabel="카페 하위 카테고리"
                defaultOpen
                onClick={noop}
              >
                <Children names={["커피", "디저트"]} color="green" />
              </ListParentItem>
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="늘 펼친 화면 · 편집">
        <Cell width={400}>
          <Specimen
            spec="list"
            combo={{ nest: "parent", expanded: "expanded", mode: "fixed" }}
          >
            <List aria-label="지출 카테고리 · 편집 모드(꺾쇠 없이 늘 펼침)">
              <ListParentItem
                prefix={
                  <Tile color="violet">
                    <Coffee />
                  </Tile>
                }
                title="취미"
                detail="collapsible={false} 면 꺾쇠 자리를 비우고 늘 펼친다"
                collapsible={false}
                onClick={noop}
              >
                <Children names={["영화", "게임"]} color="violet" />
              </ListParentItem>
            </List>
          </Specimen>
        </Cell>
      </DemoRow>
      <DemoRow label="직접 눌러 보기">
        <Cell width={400}>
          <List aria-label="직접 눌러 보기 · 식비">
            <ListParentItem
              prefix={
                <Tile color="orange">
                  <Utensils />
                </Tile>
              }
              title="식비 · 줄을 누르면 편집(여기서는 아무 일 없음)"
              detail={open ? "하위 6개 펼침" : "하위 6개 접힘"}
              expandLabel="식비 하위 카테고리"
              open={open}
              onOpenChange={setOpen}
              onClick={noop}
            >
              <Children names={FOOD_CHILDREN} color="orange" />
            </ListParentItem>
          </List>
        </Cell>
      </DemoRow>
    </DemoBlock>
  );
};

// 꺾쇠 단추의 올림 · 누름 · 포커스 — 검사기는 견본 뿌리의 가운데를 올리고 · 누르고 · 포커스한다. 줄 본문 가운데는 꺾쇠 단추가 아니므로
// 폭 52 · 높이 64(= 줄의 앞쪽 4 + 44 + 4)의 틀을 뿌리로 두고 줄은 그 틀에서 오른쪽으로 넘쳐 그린다(검사용 틀 — 화면의 모습은 같다)
const ExpandProbe = ({
  state,
}: {
  state: "hovered" | "pressed" | "focused";
}) => (
  <Specimen
    spec="list"
    combo={{ nest: "parent", expanded: "collapsed" }}
    state={state}
  >
    <div
      className="relative mr-[308px] flex h-16 w-[52px] shrink-0 flex-col gap-0"
      {...(state === "focused"
        ? passFocus("[data-slot=list-expand-button]")
        : {})}
    >
      <List
        aria-label={`꺾쇠 단추 · ${state}`}
        className="absolute left-0 top-0 w-[360px] rounded-r2 bg-bg-layer-default"
      >
        <ListParentItem
          prefix={
            <Tile color="orange">
              <Utensils />
            </Tile>
          }
          title="식비"
          detail="꺾쇠 단추만 바탕이 생긴다"
          expandLabel="식비 하위 카테고리"
          onClick={noop}
        >
          <Children names={["외식", "배달음식"]} color="orange" />
        </ListParentItem>
      </List>
    </div>
  </Specimen>
);

const NestedStatesDemo = () => (
  <DemoBlock title="하위 줄 상태 — 줄 본문(올림 · 누름 · 포커스)과 꺾쇠 단추(올림 · 누름 · 포커스)는 따로다. 단추는 단추만 바탕이 생기고 줄은 줄지 않는다">
    <DemoRow label="줄 본문">
      {(["enabled", "hovered", "focused", "pressed", "disabled"] as const).map(
        (state) => (
          <Cell key={state} width={360}>
            <Specimen
              spec="list"
              combo={{ nest: "parent", expanded: "collapsed" }}
              state={state}
            >
              <List
                aria-label={`부모 줄 · ${state}`}
                {...(state === "focused" ? passFocus() : {})}
              >
                <ListParentItem
                  disabled={state === "disabled"}
                  prefix={
                    <Tile color="orange">
                      <Utensils />
                    </Tile>
                  }
                  title="식비"
                  detail="지출 · 하위 2개"
                  expandLabel="식비 하위 카테고리"
                  onClick={noop}
                >
                  <Children names={["외식", "배달음식"]} color="orange" />
                </ListParentItem>
              </List>
            </Specimen>
          </Cell>
        ),
      )}
    </DemoRow>
    <DemoRow label="꺾쇠 단추">
      <ExpandProbe state="hovered" />
      <ExpandProbe state="pressed" />
      <ExpandProbe state="focused" />
    </DemoRow>
  </DemoBlock>
);

// ── 가장 나쁜 값 ─────────────────────────────────────────────

const WorstDemo = () => (
  <DemoBlock title="가장 나쁜 값 — 아주 긴 제목 · 1억이 넘는 금액 · 띄어쓰기 없는 긴 낱말 · 접힌 하위 줄이 많은 부모. 폰 폭 320 · 360. 뒤 붙이개는 줄지 않고 본문이 1em 까지 양보한다 · 제목 · 글 설명은 칸 끝에서 끊고 · 글로 넘긴 값은 줄 끝에서 끊어 본문 위로 넘치지 않는다(Q-001 A)">
    <DemoRow label="긴 제목 · 큰 금액 320">
      <Cell width={320}>
        <Specimen spec="list" combo={{ align: "top" }}>
          <List aria-label="가장 나쁜 값 · 거래">
            <ListButtonItem
              align="top"
              prefix={
                <Tile color="pink">
                  <ShoppingBag />
                </Tile>
              }
              title="롯데백화점 본점 지하 1층 식품관 프리미엄 한우 선물세트 · 추석 명절 대량 구매"
              detail={
                <TagGroup size="t3">
                  <TagGroupItem>쇼핑</TagGroupItem>
                  <TagGroupItem>그루 체크카드 · 개인 사업자</TagGroupItem>
                  <TagGroupItem>2026년 10월 2일 오후 2:30</TagGroupItem>
                </TagGroup>
              }
              suffix={
                <b className="font-bold text-fg-neutral">-123,456,789원</b>
              }
            />
          </List>
        </Specimen>
      </Cell>
      <Cell width={320}>
        <Specimen spec="list" combo={{}}>
          <List aria-label="가장 나쁜 값 · 큰 금액 한 줄">
            <ListButtonItem
              prefix={
                <Tile color="blue">
                  <Landmark />
                </Tile>
              }
              title="입출금 통장"
              suffix={
                <b className="font-bold text-fg-neutral">
                  -1,234,567,890,123원
                </b>
              }
            />
          </List>
        </Specimen>
      </Cell>
    </DemoRow>
    <DemoRow label="글 값 · 긴 이메일 계좌 320 · 360">
      <Cell width={320}>
        <Specimen spec="list" combo={{}}>
          <List aria-label="가장 나쁜 값 · 글 값 320">
            <ListItem
              title="이메일"
              suffix="groo.desk.design.system.long.address@example-company-domain.co.kr"
            />
            <ListItem
              title="계좌번호"
              suffix="1002-123-456789-0123456789-0123456789"
            />
          </List>
        </Specimen>
      </Cell>
      <Cell width={360}>
        <Specimen spec="list" combo={{}}>
          <List aria-label="가장 나쁜 값 · 긴 제목과 긴 글 값 360">
            <ListItem
              title="그루 체크카드 · 개인 사업자 연결 계정 이름"
              detail="groo-desk-design-system-account-identifier-0123456789"
              suffix="주식회사 그루 담다 디자인 시스템 연구소 대표자 명의"
            />
          </List>
        </Specimen>
      </Cell>
    </DemoRow>
    <DemoRow label="긴 낱말 360">
      <Cell>
        <Specimen spec="list" combo={{}}>
          <List aria-label="가장 나쁜 값 · 긴 낱말">
            <ListItem
              prefix={<Mail />}
              title="porest-desk-front-design-system-list-component-with-a-very-long-name"
              detail="띄어쓰기 없는 낱말은 칸 끝에서만 끊긴다"
            />
            <ListItem
              title="이메일"
              suffix="groo.desk.design.system@example-company-domain.co.kr"
            />
          </List>
        </Specimen>
      </Cell>
    </DemoRow>
    <DemoRow label="접힌 하위 많음 360">
      <Cell width={360}>
        <Specimen spec="list" combo={{ nest: "parent", expanded: "collapsed" }}>
          <List aria-label="가장 나쁜 값 · 접힌 하위 줄 많은 부모">
            <ListParentItem
              prefix={
                <Tile color="orange">
                  <Utensils />
                </Tile>
              }
              title="식비 · 외식 · 배달음식 · 장보기 · 카페 · 간식 · 술 · 유흥 전부"
              detail="지출 · 하위 48개"
              expandLabel="식비 · 외식 · 배달음식 · 장보기 · 카페 · 간식 · 술 · 유흥 전부 하위 카테고리"
              onClick={noop}
            >
              {Array.from({ length: 48 }, (_, i) => (
                <ListButtonItem
                  key={i}
                  prefix={
                    <Tile color="orange">
                      <Tag />
                    </Tile>
                  }
                  title={`하위 카테고리 ${i + 1}`}
                  detail="지출"
                  onClick={noop}
                />
              ))}
            </ListParentItem>
          </List>
        </Specimen>
      </Cell>
    </DemoRow>
  </DemoBlock>
);

// ── 직접 눌러 보기 ───────────────────────────────────────────

const LiveDemo = () => {
  const [on, setOn] = useState(true);
  const [picked, setPicked] = useState<string[]>(["거래 내역"]);
  const [currency, setCurrency] = useState("KRW");
  const [clicks, setClicks] = useState(0);
  return (
    <DemoBlock title="직접 눌러 보기 — Tab 으로 포커스, Space 로 바꾼다. 줄 어디를 눌러도 끼운 컨트롤이 바뀌고, 줄이 줄 때 컨트롤은 따로 줄지 않는다">
      <DemoRow label="누르는 줄 · 컨트롤">
        <Cell>
          <ListHeader id="live-header">설정</ListHeader>
          <List aria-labelledby="live-header">
            <ListButtonItem
              prefix={<User />}
              title="계정"
              detail={`${clicks}번 눌렀어요`}
              suffix={<ChevronRight />}
              onClick={() => setClicks((n) => n + 1)}
            />
            <ListSwitchItem
              prefix={<Bell />}
              title="결제 알림"
              detail={on ? "켜짐" : "꺼짐"}
              checked={on}
              onCheckedChange={setOn}
            />
          </List>
        </Cell>
        <Cell>
          <ListHeader id="live-check">내보낼 항목</ListHeader>
          <ListCheckGroup aria-labelledby="live-check">
            {["거래 내역", "예산", "메모"].map((name) => (
              <ListCheckItem
                key={name}
                title={name}
                checked={picked.includes(name)}
                onCheckedChange={(next) =>
                  setPicked(
                    next === true
                      ? [...picked, name]
                      : picked.filter((p) => p !== name),
                  )
                }
              />
            ))}
          </ListCheckGroup>
        </Cell>
        <Cell>
          <ListHeader id="live-currency">기본 통화</ListHeader>
          <ListRadioGroup
            aria-labelledby="live-currency"
            value={currency}
            onValueChange={setCurrency}
          >
            <ListRadioItem value="KRW" title="대한민국 원" detail="KRW" />
            <ListRadioItem value="USD" title="미국 달러" detail="USD" />
          </ListRadioGroup>
        </Cell>
      </DemoRow>
    </DemoBlock>
  );
};

/** 카탈로그(/dev/ds) — 줄의 종류 · 앞 · 뒤 · 설명 · 맞춤 · 강조 · 합계에 안 드는 줄 · 상태 · 목록 제목 · 구분선 · 하위 줄 · 가장 나쁜 값 */
export const ListDemo = () => (
  <div className="flex flex-col gap-x8">
    <KindsDemo />
    <PrefixDemo />
    <AlignHighlightDemo />
    <StatesDemo />
    <HeaderDividerDemo />
    <NestedDemo />
    <NestedStatesDemo />
    <WorstDemo />
    <LiveDemo />
  </div>
);
