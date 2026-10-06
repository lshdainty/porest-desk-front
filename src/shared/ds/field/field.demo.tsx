import { Fragment, useRef, type InputHTMLAttributes } from "react";
import { Info } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Field } from "./field";
import { useFieldControl, useTextControl } from "./field-context";

const LABEL_WEIGHTS = ["medium", "bold"] as const;

// 입력 자리 — Input(src/shared/ds/input)이 오기 전까지 쓰는 맨 칸. Field 의 훅(useFieldControl · useTextControl)을 그대로
// 써서 라벨 연결 · 설명 · 오류 · 글자 수가 실제로 움직인다. 점선은 "Input 이 아니다" 는 표시다 — 칸의 모양은 Input 스펙이 정한다
const DemoInput = ({
  onChange,
  onCompositionEnd,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => {
  const ref = useRef<HTMLInputElement>(null);
  const control = useFieldControl(props);
  const text = useTextControl(ref, { onChange, onCompositionEnd });
  return (
    <input
      ref={ref}
      {...props}
      {...control}
      onChange={text.onChange}
      onCompositionEnd={text.onCompositionEnd}
      className="h-10 w-full min-w-0 rounded-r2 border border-dashed border-stroke-neutral-weak bg-transparent px-x3 font-sans text-t5 text-fg-neutral placeholder:text-fg-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring"
    />
  );
};

// 머리 오른쪽 보조 액션 — Button ghost · neutralSubtle · xsmall · 오른쪽 flush(field.md)
const ExampleAction = () => (
  <Button
    type="button"
    variant="ghost"
    ghostColor="neutralSubtle"
    size="xsmall"
    flush="right"
  >
    예시 보기
  </Button>
);

/** 카탈로그(/dev/ds) — 라벨 굵기 × 상태(기본 · 오류), 머리(필수 점 또는 "선택" · 보조 액션) · 꼬리(설명 · 오류 · 글자 수) */
export const FieldDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="라벨 굵기 × 상태 — 한 폼(Field 사이 24)에는 필수 점 또는 “선택” 하나만 쓴다. 오류는 설명 자리를 대신한다">
      {LABEL_WEIGHTS.map((labelWeight) => (
        <Fragment key={labelWeight}>
          <DemoRow label={`${labelWeight} · 필수 점`}>
            <div className="flex w-full max-w-[320px] flex-col gap-x6">
              <Specimen spec="field" combo={{ labelWeight }}>
                <Field
                  label="카테고리 이름"
                  labelWeight={labelWeight}
                  showRequiredIndicator
                  headerAction={<ExampleAction />}
                  description="목록과 통계에 이 이름으로 보여요."
                  descriptionIcon={<Info />}
                  maxGraphemeCount={12}
                >
                  <DemoInput
                    defaultValue="반려동물"
                    placeholder="예: 반려동물, 부수입"
                  />
                </Field>
              </Specimen>
              <Specimen spec="field" combo={{ labelWeight }} state="invalid">
                <Field
                  label="아이디"
                  labelWeight={labelWeight}
                  showRequiredIndicator
                  description="영문 · 숫자 20자까지"
                  maxGraphemeCount={20}
                  invalid
                  errorMessage="이미 쓰고 있는 아이디예요."
                >
                  <DemoInput defaultValue="porest" />
                </Field>
              </Specimen>
            </div>
          </DemoRow>
          <DemoRow label={`${labelWeight} · 선택`}>
            <div className="flex w-full max-w-[320px] flex-col gap-x6">
              <Specimen spec="field" combo={{ labelWeight }}>
                <Field
                  label="메모"
                  labelWeight={labelWeight}
                  indicator="선택"
                  description="거래 목록에서 이름 아래에 보여요."
                >
                  <DemoInput placeholder="예: 점심 회식" />
                </Field>
              </Specimen>
              <Specimen spec="field" combo={{ labelWeight }} state="invalid">
                <Field
                  label="휴대폰 번호"
                  labelWeight={labelWeight}
                  indicator="선택"
                  invalid
                  errorMessage="휴대폰 번호 10~11자리로 입력해주세요."
                >
                  <DemoInput defaultValue="010123" inputMode="tel" />
                </Field>
              </Specimen>
            </div>
          </DemoRow>
        </Fragment>
      ))}
    </DemoBlock>

    <DemoBlock title="글자 수 — 자소 단위로 센다(국기 이모지도 한 글자) · 비면 최대와 같은 색 · 최대에서 멈춘다(직접 써 본다)">
      <DemoRow label="글자 수">
        <div className="w-full max-w-[320px]">
          <Field label="카테고리 이름" maxGraphemeCount={5}>
            <DemoInput placeholder="5자까지" />
          </Field>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
