import type { ReactNode } from "react";
import { Coffee, Utensils, WalletCards } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { List, ListButtonItem, ListItem, ListTile } from "@/shared/ds/list";
import { ResultSection } from "@/shared/ds/result-section";
import { Skeleton } from "@/shared/ds/skeleton";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeroAmount,
  CardHeroDetail,
  CardHeroLabel,
  CardLink,
  CardStat,
  CardTitle,
  Delta,
} from "./card";

const noop = () => {};
// 링크는 견본 안에서 어디로도 가지 않는다 — 검사기가 눌렀다 떼면 클릭이 되어 페이지가 바뀐다
const stay = (e: { preventDefault: () => void }) => e.preventDefault();

// 회색 바닥 — 카드는 늘 바닥(bg-layer-basement) 위에 둔다. 폭은 폰(360) · 데스크톱 칸(480)
const Floor = ({
  children,
  width = 360,
}: {
  children: ReactNode;
  width?: number;
}) => (
  <div
    className="flex shrink-0 flex-col gap-x2 rounded-r3 bg-bg-layer-basement p-x4"
    style={{ width }}
  >
    {children}
  </div>
);

const Rows = () => (
  <List aria-label="오늘 쓴 돈">
    <ListButtonItem
      prefix={
        <ListTile className="bg-chart-blue-weak text-chart-blue">
          <Utensils />
        </ListTile>
      }
      title="점심 — 아주 긴 가게 이름이 두 줄까지 이어질 때 줄이 어떻게 보이는지"
      detail="식비 · 신한카드"
      suffix="-12,000원"
      onClick={noop}
    />
    <ListItem
      prefix={
        <ListTile className="bg-chart-orange-weak text-chart-orange">
          <Coffee />
        </ListTile>
      }
      title="스타벅스 강남점"
      suffix="-5,500원"
    />
  </List>
);

/** 카탈로그(/dev/ds) — 면(바닥 위 흰 면) · 머리 · 본문 · 목록 · 아코디언 · 누름 셋 · 지표 · 증감 · 순자산 · 기다림 · 실패 */
export const CardDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="글 카드 — 머리(제목 16 · 700 + 전체 보기, 보이는 32 · 누르는 44) + 본문(여백 24)">
      <DemoRow label="default">
        <Floor>
          <Specimen spec="card" combo={{}}>
            <Card>
              <CardHeader>
                <CardTitle>이번 달 예산</CardTitle>
                <CardAction onClick={noop}>전체 보기</CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-t4">식비 320,000원 중 184,000원을 썼어요.</p>
              </CardContent>
            </Card>
          </Specimen>
        </Floor>
      </DemoRow>
      <DemoRow label="긴 제목">
        <Floor width={300}>
          <Card>
            <CardHeader>
              <CardTitle>
                아주 긴 카드 제목이 한 줄을 넘어가는 경우의 모습
              </CardTitle>
              <CardAction onClick={noop}>관리</CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-t4 break-keep">
                제목이 길어도 머리 동작은 줄어들지 않고 제목이 줄을 바꾼다.
              </p>
            </CardContent>
          </Card>
        </Floor>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="목록 카드(body=list) — 줄이 가장자리까지 · 머리 위 24 · 아래 4 · 카드 아래 12 / 아코디언 카드(body=accordion) — 카드 아래 8">
      <DemoRow label="list">
        <Floor>
          <Specimen spec="card" combo={{ body: "list" }}>
            <Card body="list">
              <CardHeader>
                <CardTitle>오늘 쓴 돈</CardTitle>
                <CardAction href="#card" onClick={stay}>
                  전체 보기
                </CardAction>
              </CardHeader>
              <Rows />
            </Card>
          </Specimen>
        </Floor>
        <Floor>
          <Card body="list">
            <Rows />
          </Card>
        </Floor>
      </DemoRow>
      <DemoRow label="accordion">
        <Floor>
          <Specimen spec="card" combo={{ body: "accordion" }}>
            <Card body="accordion">
              <CardHeader>
                <CardTitle>혜택 · 12건</CardTitle>
              </CardHeader>
              {/* Accordion 은 아직 만들지 않았다 — 트리거가 제 좌우 24 · 위아래 16 을 갖는 자리를 같은 모양의 줄로 둔다 */}
              <div className="px-x6 py-x4 text-t5">주유 할인 — 리터당 60원</div>
            </Card>
          </Specimen>
        </Floor>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="누름 — whole(카드 전체가 한 곳: 색 + 2px) · peers(대등한 동작이 있어 색만)">
      <DemoRow label="none">
        <Floor width={300}>
          <Specimen spec="card" combo={{ press: "none" }}>
            <Card>
              <CardContent>
                <p className="text-t4">보기만 하는 카드</p>
              </CardContent>
            </Card>
          </Specimen>
        </Floor>
      </DemoRow>
      <DemoRow label="whole">
        {(["enabled", "hovered", "pressed", "focused"] as const).map(
          (state) => (
            <Floor key={state} width={220}>
              <Specimen spec="card" combo={{ press: "whole" }} state={state}>
                <Card href="#card" onClick={stay}>
                  <CardContent>
                    <p className="text-t5 font-bold">식비 예산</p>
                    <p className="text-t4">{state}</p>
                  </CardContent>
                </Card>
              </Specimen>
            </Floor>
          ),
        )}
      </DemoRow>
      <DemoRow label="peers">
        {(["enabled", "hovered", "pressed"] as const).map((state) => (
          <Floor key={state} width={220}>
            <Specimen spec="card" combo={{ press: "peers" }} state={state}>
              <Card press="peers">
                <div className="flex items-start justify-between gap-x2">
                  <CardLink href="#card" onClick={stay}>
                    장보기 메모
                  </CardLink>
                  <button
                    type="button"
                    aria-label="장보기 메모 고정"
                    className="-mr-x2 -mt-x2 size-10 shrink-0 text-fg-neutral-subtle"
                    onClick={noop}
                  >
                    ★
                  </button>
                </div>
                <CardContent>
                  <p className="text-t4">{state}</p>
                </CardContent>
              </Card>
            </Specimen>
          </Floor>
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="지표 카드 — 폰은 한 줄에 하나(large 24 / 32), 데스크톱 격자 셋 · 넷은 small 20 / 27 · 증감은 방향(▲ 빨강 · ▼ 파랑 · 변화 없음)">
      <DemoRow label="large ▲">
        <Floor>
          <Specimen spec="card" combo={{ stat: "large", delta: "up" }}>
            <Card>
              <CardStat
                label="이번 달 지출"
                value="1,240,000원"
                delta={{
                  direction: "up",
                  value: "+12%",
                  text: "지난달보다",
                  srText: "지난달보다 12% 더 썼어요",
                }}
              />
            </Card>
          </Specimen>
        </Floor>
        <Floor>
          <Specimen spec="card" combo={{ stat: "large", delta: "down" }}>
            <Card>
              <CardStat
                label="이번 달 수입"
                value="4,200,000원"
                delta={{ direction: "down", value: "−3%", text: "지난달보다" }}
              />
            </Card>
          </Specimen>
        </Floor>
        <Floor>
          <Specimen spec="card" combo={{ stat: "large", delta: "flat" }}>
            <Card>
              <CardStat
                label="이번 달 저축"
                value="500,000원"
                delta={{ direction: "flat", text: "지난달보다" }}
              />
            </Card>
          </Specimen>
        </Floor>
      </DemoRow>
      <DemoRow label="small">
        <Floor width={200}>
          <Specimen spec="card" combo={{ stat: "small", delta: "up" }}>
            <Card>
              <CardStat
                size="small"
                label="이번 달 지출"
                value="1,240,000원"
                delta={{ direction: "up", value: "12%", text: "지난달보다" }}
              />
            </Card>
          </Specimen>
        </Floor>
      </DemoRow>
      <DemoRow label="가장 나쁜 값">
        <Floor width={300}>
          <Card>
            <CardStat
              label="이번 달 지출 — 이름이 아주 긴 지표 라벨"
              value="−123,456,789,012원"
              delta={{
                direction: "up",
                value: "+-12.5%",
                text: "지난달보다 훨씬 많이",
              }}
            />
          </Card>
        </Floor>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="순자산 카드(hero) — 브랜드 채움 · 흰 글자, 다크도 짙은 채움 · 누르면 2px 축소만">
      <DemoRow label="hero">
        <Floor>
          <Specimen spec="card" combo={{ variant: "hero" }}>
            <Card variant="hero">
              <CardHeroLabel>순자산</CardHeroLabel>
              <CardHeroAmount>42,898,100원</CardHeroAmount>
              <CardHeroDetail>
                자산 80,000,000원 · 부채 37,101,900원
              </CardHeroDetail>
            </Card>
          </Specimen>
        </Floor>
        {/* 증감은 흰 글자 — 견본이 아니다: card.yaml 의 delta 규칙(방향 색 · 위 4)은 순자산 카드의 예외를 말하지 않는다 */}
        <Floor>
          <Card variant="hero">
            <CardHeroLabel>순자산</CardHeroLabel>
            <CardHeroAmount>42,898,100원</CardHeroAmount>
            <CardHeroDetail>
              <Delta direction="up" value="1.8%" text="지난달보다" />
            </CardHeroDetail>
          </Card>
        </Floor>
        {(["hovered", "pressed"] as const).map((state) => (
          <Floor key={state}>
            <Specimen
              spec="card"
              combo={{ variant: "hero", press: "whole" }}
              state={state}
            >
              <Card variant="hero" href="#card" onClick={stay}>
                <CardHeroLabel>순자산 — {state}</CardHeroLabel>
                <CardHeroAmount>-123,456,789,012원</CardHeroAmount>
              </Card>
            </Specimen>
          </Floor>
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="기다림 · 실패 — 틀은 처음부터, 서버에서 올 자리만 Skeleton · 데이터 하나가 실패하면 그 카드 안 Result Section">
      <DemoRow label="기다림">
        <Floor>
          <Card>
            <CardHeader>
              <CardTitle>이번 달 예산</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton text="t4" className="w-3/4" />
              <Skeleton text="t4" className="w-1/2" />
            </CardContent>
          </Card>
        </Floor>
      </DemoRow>
      <DemoRow label="실패">
        <Floor>
          <Card>
            <CardHeader>
              <CardTitle>이번 달 예산</CardTitle>
            </CardHeader>
            <ResultSection
              kind="failure"
              size="medium"
              title="예산을 불러오지 못했어요"
              description="잠시 뒤 다시 시도해 주세요."
              primaryAction={{ label: "다시 시도", onClick: noop }}
            />
          </Card>
        </Floor>
        <Floor>
          <Card body="list">
            <CardHeader>
              <CardTitle>오늘 쓴 돈</CardTitle>
            </CardHeader>
            <ResultSection
              kind="empty"
              size="medium"
              icon={<WalletCards />}
              title="오늘 쓴 돈이 없어요"
            />
          </Card>
        </Floor>
      </DemoRow>
    </DemoBlock>
  </div>
);
