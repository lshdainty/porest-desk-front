import spec from "@/shared/ds/spec/category-icons.json";

/*
 * Porest 카테고리 아이콘 세트 — 카테고리 · 저축 목표에 붙이는 아이콘을 고르는 Icon Picker 의 범위(2026-10-09).
 * 원본은 porest-design specs/components/category-icons.yaml 이고, 이 레포는 그 JSON(src/shared/ds/spec/category-icons.json —
 * npm run design:sync 가 가져온다)을 그대로 읽는다. 148개 · 13 묶음의 표를 TS 로 한 번 더 옮겨 적지 않는다(웹 · 앱이 같은 YAML 에서
 * 만든다 — 표가 둘이 되면 어긋난다). 아이콘 그림만 category-icon-glyphs.ts 가 id 에 잇는다.
 *
 * lucide 전체(2,007)를 열지 않고 카테고리에 쓸 만한 것만 묶음으로 둔다(사용자 결정 15A). 이름은 한국어 하나 — 칸의 이름(보조 기술 ·
 * 툴팁)과 트리거의 값 글이다. 영어 lucide 이름(id)은 저장 값일 뿐 화면에 내지 않는다.
 *
 *   findCategoryIcon(id)       저장 값(lucide 이름) → 세트의 한 줄. id 또는 lucideAliases(옛 이름 — 서버 시드의 home)로 찾는다.
 *                              세트 밖 · 빈 값이면 null — 빈 값(null · "")은 DEFAULT_CATEGORY_ICON(태그)으로 그리고, 세트 밖 저장 값은
 *                              지우지 않고 그대로 그린다(lucide-react/dynamic 의 DynamicIcon)
 *   searchCategoryIcons(query) 찾는 말 → 걸린 아이콘(세트 차례 그대로). 찾는 말과 name · aliases · id 를 소문자로 바꾸고 공백을 모두 뺀 뒤
 *                              부분 일치다("커피" → 커피 · 원두, "월세" → 집, "coffee" → 커피). 빈 찾는 말이면 세트 전체
 */

export interface CategoryIcon {
  /** lucide 이름(kebab) — 저장 값 */
  readonly id: string;
  /** 묶음 — "식비" · "카페" … */
  readonly group: string;
  /** 한국어 이름 — 칸의 이름 · 트리거의 값 글. 세트 안에서 겹치지 않는다 */
  readonly name: string;
  /** 찾는 말 — 이름 말고 이 아이콘으로 찾을 말("월세" → 집) */
  readonly aliases: readonly string[];
  /** 같은 아이콘의 다른 lucide 이름(옛 이름) — 저장 값이 이 이름이어도 이 아이콘을 고른 것으로 본다 */
  readonly lucideAliases?: readonly string[];
}

/** 기본 아이콘(태그) — 아이콘이 없는 항목 · 새 카테고리의 처음 값 */
export const DEFAULT_CATEGORY_ICON: string = spec.data.default;

/** 묶음 차례 */
export const CATEGORY_ICON_GROUPS: readonly string[] = spec.data.groups;

/** 세트 — 표 차례 그대로 */
export const CATEGORY_ICONS: readonly CategoryIcon[] = spec.data.entries;

// 찾는 말 · 표의 글 — 소문자로 바꾸고 공백을 모두 뺀다(웹 · 앱이 같은 규칙으로)
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

// 저장 값 → 세트의 한 줄(id 와 lucideAliases 모두)
const BY_ID = new Map<string, CategoryIcon>();
for (const icon of CATEGORY_ICONS) {
  BY_ID.set(icon.id, icon);
  for (const alias of icon.lucideAliases ?? []) BY_ID.set(alias, icon);
}

// 아이콘마다 찾는 글(이름 · 찾는 말 · id) — 표 차례 그대로
const HAYSTACK = CATEGORY_ICONS.map((icon) => ({
  icon,
  keys: [icon.name, ...icon.aliases, icon.id].map(normalize),
}));

/** 저장 값(lucide 이름) → 세트의 한 줄. id 또는 lucideAliases 로 찾고, 세트 밖 · 빈 값이면 null */
export function findCategoryIcon(
  id: string | null | undefined,
): CategoryIcon | null {
  const key = id?.trim() ?? "";
  if (key === "") return null;
  return BY_ID.get(key) ?? null;
}

/** 찾는 말 → 걸린 아이콘(세트 차례). 이름 · 찾는 말 · id 의 부분 일치 — 소문자로 바꾸고 공백을 뺀 뒤. 빈 찾는 말이면 세트 전체 */
export function searchCategoryIcons(query: string): readonly CategoryIcon[] {
  const q = normalize(query);
  if (q === "") return CATEGORY_ICONS;
  return HAYSTACK.filter(({ keys }) => keys.some((k) => k.includes(q))).map(
    ({ icon }) => icon,
  );
}

/** 묶음마다 아이콘 — 묶음 차례 · 표 차례 그대로. 아이콘이 없는 묶음은 두지 않는다 */
export const CATEGORY_ICON_SECTIONS: readonly {
  readonly group: string;
  readonly icons: readonly CategoryIcon[];
}[] = CATEGORY_ICON_GROUPS.map((group) => ({
  group,
  icons: CATEGORY_ICONS.filter((icon) => icon.group === group),
})).filter((section) => section.icons.length > 0);
