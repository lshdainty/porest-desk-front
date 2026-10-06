/*
 * Porest Avatar 의 이니셜 · 이름 색 규칙 — 웹 · 앱이 같은 규칙(porest-design specs/components/avatar.md "이니셜과 이름 색").
 * 컴포넌트는 avatar.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침). 크기 · 모양은 avatar.tsx 머리 주석.
 *
 *   avatarInitial  이니셜 — 표시 이름(앞뒤 공백만 뺀 글)의 첫 글자 하나(사용자가 보는 글자 단위 — Intl.Segmenter). 로마자는
 *                  대문자로, 한글 · 숫자 · 그림 글자는 그대로. "김민수" → "김", "Kim Minsu" → "K"
 *   avatarHue      이름 색 — 표시 이름의 유니코드 코드 포인트(UTF-16 단위가 아니다) 합 % 10 → 차트 10색(v110 순서)
 *                  blue · green · orange · violet · pink · indigo · red · yellow · brown · gray.
 *                  "김민수" 142420 → blue · "이서연" 151168 → brown · "Kim Minsu" 845 → indigo. 이름이 비면 gray(글자 없음)
 *                  앱은 같은 규칙을 Dart 로 두고(characters.first · runes) 이 예시 이름으로 같은 답이 나오는지 시험한다.
 *                  물건(은행 · 증권 · 카드 · 코인 · 금 · 회사)의 Logo Tile 도 이 두 함수로 첫 글자 · 이름 색을 고른다
 */

const AVATAR_HUES = [
  "blue",
  "green",
  "orange",
  "violet",
  "pink",
  "indigo",
  "red",
  "yellow",
  "brown",
  "gray",
] as const;
export type AvatarHue = (typeof AVATAR_HUES)[number];

/** 표시 이름 — 서버가 준 이름에서 앞뒤 공백만 뺀다(정규화 · 바꾸기를 하지 않는다) */
export const avatarDisplayName = (name: string) => name.trim();

// 사용자가 보는 글자 단위 — Intl.Segmenter(ES2022). 이 레포의 TypeScript lib 은 ES2020 이라 쓰는 모양만 여기 적는다
type GraphemeSegmenter = {
  segment(input: string): Iterable<{ segment: string }>;
};
const Segmenter = (
  Intl as unknown as {
    Segmenter?: new (
      locales: string | undefined,
      options: { granularity: "grapheme" },
    ) => GraphemeSegmenter;
  }
).Segmenter;
const graphemes = Segmenter
  ? new Segmenter(undefined, { granularity: "grapheme" })
  : null;

/** 이니셜 — 표시 이름의 첫 글자 하나(사용자가 보는 글자 단위), 로마자는 대문자. 이름이 비면 "" */
export function avatarInitial(name: string): string {
  const shown = avatarDisplayName(name);
  if (shown === "") return "";
  const first: string = graphemes
    ? (graphemes.segment(shown)[Symbol.iterator]().next().value?.segment ?? "")
    : (Array.from(shown)[0] ?? "");
  return first.toUpperCase();
}

/** 이름 색 — 표시 이름의 유니코드 코드 포인트 합 % 10 → 차트 10색(v110 순서). 이름이 비면 gray */
export function avatarHue(name: string): AvatarHue {
  const shown = avatarDisplayName(name);
  if (shown === "") return "gray";
  let sum = 0;
  for (const ch of shown) sum += ch.codePointAt(0) ?? 0;
  return AVATAR_HUES[sum % 10] ?? "gray";
}
