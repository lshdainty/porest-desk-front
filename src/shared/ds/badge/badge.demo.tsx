import { Clock, Eye, Pencil } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Badge, BadgeGroup } from "./badge";

// 같은 톤이면 weak → outline → solid 순으로 강해진다
const VARIANTS = ["weak", "outline", "solid"] as const;
const SIZES = ["medium", "large"] as const;
// 톤과 그 예 글(badge.md 의 Tone 표)
const TONES = [
  ["neutral", "예정"],
  ["brand", "Pro"],
  ["informative", "읽기 전용"],
  ["positive", "승인"],
  ["warning", "만료 임박"],
  ["critical", "연체"],
] as const;

/** 카탈로그(/dev/ds) — 변형 × 톤 × 크기, 앞 아이콘, 묶음, 말줄임, 놓는 바탕. 상태는 enabled 하나다(누르지 않는다) */
export const BadgeDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="변형 × 톤 × 크기 — weak · outline · solid 마다 medium 20 · large 24">
      {TONES.map(([tone, text]) => (
        <DemoRow key={tone} label={tone}>
          {VARIANTS.map((variant) =>
            SIZES.map((size) => (
              <Specimen
                key={`${variant}-${size}`}
                spec="badge"
                combo={{ variant, tone, size }}
              >
                <Badge variant={variant} tone={tone} size={size}>
                  {text}
                </Badge>
              </Specimen>
            )),
          )}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="앞 아이콘 — 크기는 배지가 정하고(12 · 14) 글자색을 따른다, 글과 사이 2">
      {VARIANTS.map((variant) => (
        <DemoRow key={variant} label={variant}>
          {SIZES.map((size) => (
            <Specimen
              key={`${size}-pencil`}
              spec="badge"
              combo={{ variant, tone: "positive", size }}
            >
              <Badge
                variant={variant}
                tone="positive"
                size={size}
                prefixIcon={<Pencil />}
              >
                편집 가능
              </Badge>
            </Specimen>
          ))}
          {SIZES.map((size) => (
            <Specimen
              key={`${size}-eye`}
              spec="badge"
              combo={{ variant, tone: "informative", size }}
            >
              <Badge
                variant={variant}
                tone="informative"
                size={size}
                prefixIcon={<Eye />}
              >
                읽기 전용
              </Badge>
            </Specimen>
          ))}
          {SIZES.map((size) => (
            <Specimen
              key={`${size}-clock`}
              spec="badge"
              combo={{ variant, size }}
            >
              <Badge variant={variant} size={size} prefixIcon={<Clock />}>
                예정
              </Badge>
            </Specimen>
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="묶음 — 한 대상에 둘까지, 사이 4 · 줄을 바꾸지 않는다">
      <DemoRow label="BadgeGroup">
        <BadgeGroup>
          <Badge size="large">신용</Badge>
          <Badge size="large" variant="solid">
            단종
          </Badge>
        </BadgeGroup>
        <BadgeGroup>
          <Badge>예정</Badge>
          <Badge tone="critical">연체 3</Badge>
        </BadgeGroup>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="말줄임 — 최대 폭이 없다. 부모가 좁을 때만(폭 48) 글이 한 줄 말줄임, 글 전체는 보조 기술이 읽는다">
      <DemoRow label="flex · w-12">
        <div className="flex w-12">
          <Specimen spec="badge" combo={{ tone: "warning" }}>
            <Badge tone="warning">만료 임박</Badge>
          </Specimen>
        </div>
      </DemoRow>
      <DemoRow label="줄 제목 옆">
        <div className="flex w-40 items-center gap-x1_5 text-t5 text-fg-neutral">
          <span className="truncate">넷플릭스 프리미엄 구독</span>
          <Specimen spec="badge" combo={{}}>
            <Badge className="shrink-0">예정</Badge>
          </Specimen>
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="놓는 바탕 — 중립 weak 는 흰 표면 위, 회색 바탕(bg-layer-basement) 위면 outline">
      <DemoRow label="흰 표면">
        <Badge>기록만</Badge>
      </DemoRow>
      <DemoRow label="회색 바탕">
        <div className="flex items-center gap-x3 rounded-r2 bg-bg-layer-basement p-x3">
          <Badge variant="outline">기록만</Badge>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
