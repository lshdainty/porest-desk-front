/*
 * Groo Time Picker 의 값 · 글 · 도구 — 수치 원본은 groo-design specs/components/time-picker.yaml(값은
 * src/shared/ds/spec/time-picker.json). 컴포넌트는 time-picker.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   roundToStep       시각 · Date 를 분 간격에 맞춰 반올림한다(시각 전체 기준 — 9시 58분 → 10시 00분). 빈 칸을 열 때 지금을 짚는 데 쓴다
 *   formatTimeValue   칸에 넣는 글 — "오후 3:00"(International Design v106, 초 없음)
 *   TIME_PICKER_LABELS  글 한 벌(한국어) — 다른 언어는 같은 꼴로 labels 에 넘긴다
 */

export interface TimeValue {
  /** 24시간의 시 — 0 ~ 23 */
  hour: number;
  /** 분 — 0 ~ 59 */
  minute: number;
}

export type MinuteStep = 1 | 5 | 10 | 15 | 30;

export const MINUTE_STEPS: readonly MinuteStep[] = [1, 5, 10, 15, 30];

export interface TimePickerLabels {
  /** 휠 이름 — 칸 라벨이 없을 때 */
  root: string;
  period: string;
  hour: string;
  minute: string;
  am: string;
  pm: string;
}

/** 한국어 글 한 벌 — 다른 언어는 같은 꼴로 labels 에 넘긴다 */
export const TIME_PICKER_LABELS: TimePickerLabels = {
  root: "시간 선택",
  period: "오전/오후",
  hour: "시",
  minute: "분",
  am: "오전",
  pm: "오후",
};

const MINUTES_IN_DAY = 24 * 60;
export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * 분 간격에 맞춰 반올림한다 — 시각 전체 기준(9시 58분 → 10시 00분). 시각은 하루를 넘으면 0시로 돌고(23시 58분 → 0시 00분),
 * Date 는 다음 날로 넘어간다. 초는 버리고 분으로 셈한다(SEED 와 같다 — 9시 13분 40초도 9시 13분에서 반올림).
 */
export function roundToStep(time: TimeValue, step: MinuteStep): TimeValue;
export function roundToStep(date: Date, step: MinuteStep): Date;
export function roundToStep(
  input: TimeValue | Date,
  step: MinuteStep,
): TimeValue | Date {
  if (input instanceof Date) {
    const total = input.getHours() * 60 + input.getMinutes();
    const rounded = Math.round(total / step) * step;
    return new Date(
      input.getFullYear(),
      input.getMonth(),
      input.getDate(),
      0,
      rounded,
    );
  }
  const total = input.hour * 60 + input.minute;
  if (input.minute % step === 0 && input.hour >= 0 && input.hour < 24)
    return input;
  const rounded =
    (((Math.round(total / step) * step) % MINUTES_IN_DAY) + MINUTES_IN_DAY) %
    MINUTES_IN_DAY;
  return { hour: Math.floor(rounded / 60), minute: rounded % 60 };
}

/** 칸에 넣는 글 — "오후 3:00"(오전 · 오후 12시간, 초 없음). 비었으면 "" */
export function formatTimeValue(
  value: TimeValue | Date | undefined | null,
  labels: Pick<TimePickerLabels, "am" | "pm"> = TIME_PICKER_LABELS,
): string {
  if (!value) return "";
  const hour = value instanceof Date ? value.getHours() : value.hour;
  const minute = value instanceof Date ? value.getMinutes() : value.minute;
  return `${hour < 12 ? labels.am : labels.pm} ${hour % 12 === 0 ? 12 : hour % 12}:${pad2(minute)}`;
}
