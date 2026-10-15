/*
 * Porest Tooltip 의 값 — 수치 원본은 porest-design specs/components/help-bubble.yaml 의 opens: hover(값은
 * src/shared/ds/spec/help-bubble.json — Help Bubble 과 한 파일, tooltip.json 은 없다). 말풍선의 모양(BUBBLE ·
 * BUBBLE_TITLE · BUBBLE_POSITION · BubbleArrow)은 Help Bubble 의 것을 그대로 쓴다 — 한 벌이다(help-bubble-variants.ts).
 * 이 파일은 툴팁에만 있는 값(기다림 · 걷힘)을 둔다. 컴포넌트는 tooltip.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다).
 */

// 마우스를 올리고 열기까지 · 트리거와 말풍선을 모두 벗어난 뒤 닫기까지 · 닫힌 뒤 옆 트리거가 기다리지 않고 열리는 시간(ms).
// 키보드 초점은 바로 연다. help-bubble.json 의 root.openDelay · closeDelay · skipDelay 는 문장이라 검사기가 재지 않는다 —
// tooltip.test.tsx 가 이 값으로 맞춘다
export const OPEN_DELAY = 200;
export const CLOSE_DELAY = 100;
export const SKIP_DELAY = 300;

// 걷힌 툴팁 — 남은 사라짐(흐려짐)을 보이지 않게 둔다. 사라짐 모션 자체는 그대로 끝까지 돌아 Radix 가 그 끝에 지운다 — 모션을 없애면(animate-none)
// Radix Presence 가 지금 모션의 이름이 none 이라 끝을 알아채지 못해 말풍선을 지우지 않는다
export const TOOLTIP_CUT = "data-[cut]:invisible";
