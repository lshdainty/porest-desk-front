import spec from "@/shared/ds/spec/institution-colors.json";

/*
 * Porest 기관 색 — 은행 · 증권 · 카드사 · 코인 · 금 기관마다 색 하나와 그 위 글자색(2026-10-04 사용자 결정).
 * 원본은 porest-design specs/components/institution-colors.yaml 이고, 이 레포는 그 JSON(src/shared/ds/spec/institution-colors.json —
 * npm run design:sync 가 가져온다)을 그대로 읽는다. 표를 TS 로 한 번 더 옮겨 적지 않는다(표가 둘이 되면 같은 회사가 다른 색이 된다 —
 * 지금 제품의 두 표가 그랬다). 표를 바꾸려면 porest-design 의 YAML 을 고치고 다시 가져온다.
 *
 * 쓰는 곳 — Logo Tile 의 첫 글자 타일(face="institution") · 그림 없는 카드의 면(CardArt).
 * 기관의 브랜드 색이라 디자인 토큰이 아니다 — 모드를 따르지 않는다(라이트 · 다크 같다). 브랜드 hex 를 화면 · 컴포넌트에 따로 적지 않는다.
 *
 *   institutionColor(name)  기관 이름 → 표의 한 줄(color · text …), 없으면 null. 웹 · 앱이 같은 순서로 찾는다
 *     1. 찾는 이름과 표의 name · aliases 의 공백을 모두 뺀다
 *     2. name 또는 aliases 와 같으면 그 기관이다
 *     3. 아니면 찾는 이름에 들어 있는 name · aliases 가운데 가장 긴 것("NH농협카드 올원" → NH농협카드). 대소문자는 그대로 견준다.
 *        길이가 같으면 표에서 먼저 나온 기관이다. 표의 이름이 찾는 이름을 품는 거꾸로 맞추기("NH농협" ↔ "NH농협카드")는 하지 않는다
 *     4. 없으면 null — Logo Tile 은 Avatar 의 이름 색, 카드 면은 Content Placeholder(credit-card)
 *     기관 이름(자산의 기관 · 카드의 카드사)으로만 찾는다 — 사용자가 지은 자산 이름 · HR 회사 이름으로 찾지 않는다
 *     (짧은 별칭 "우리" · "하나" · "국민" · "기업" 이 "우리 아이 적금" · "하나투어" 에 걸린다).
 *
 * 글자색(text) — white 는 static-white(그 색 위 흰 글자가 4.5:1 이상), dark 는 라이트 fg-neutral · 다크 fg-neutral-inverted
 * (면이 모드를 따르지 않으므로 두 모드 모두 짙은 글자). 78곳 모두 4.52:1 이상이다. ci 는 대비를 맞추려 명도를 고친 곳의 원래 색이다.
 */

export type InstitutionText = "white" | "dark";

export interface InstitutionColor {
  /** 기관 이름 — 표의 대표 이름 */
  readonly name: string;
  /** 묶음 — 시중은행 · 인터넷은행 · 증권사 · 카드사 … */
  readonly category: string;
  /** 별칭 — 같은 기관으로 찾는 다른 이름 */
  readonly aliases: readonly string[];
  /** 면 색(hex) — 모드를 따르지 않는다 */
  readonly color: string;
  /** 대비를 맞추려 명도를 고친 곳의 원래 색(hex) */
  readonly ci?: string;
  /** 면 위 글자색 — white(static-white) · dark(라이트 fg-neutral · 다크 fg-neutral-inverted) */
  readonly text: InstitutionText;
}

export const INSTITUTION_COLORS: readonly InstitutionColor[] = (
  spec.data.entries as InstitutionColor[]
).map((entry) => ({ ...entry, aliases: entry.aliases ?? [] }));

// 공백을 모두 뺀다 — 찾는 이름과 표의 name · aliases 모두
const squash = (value: string) => value.replace(/\s+/g, "");

// 기관마다 찾는 열쇠(name · aliases, 공백을 뺀) — 표 순서 그대로
const KEYS = INSTITUTION_COLORS.map((entry) => ({
  entry,
  keys: [entry.name, ...entry.aliases].map(squash).filter((key) => key !== ""),
}));

/** 기관 이름 → 기관 색 표의 한 줄(color · text …). 같은 이름 · 별칭, 아니면 든 가장 긴 이름, 없으면 null */
export function institutionColor(
  name: string | null | undefined,
): InstitutionColor | null {
  const query = squash(name ?? "");
  if (query === "") return null;
  for (const { entry, keys } of KEYS) if (keys.includes(query)) return entry;
  let found: InstitutionColor | null = null;
  let longest = 0;
  for (const { entry, keys } of KEYS) {
    for (const key of keys) {
      if (key.length > longest && query.includes(key)) {
        found = entry;
        longest = key.length;
      }
    }
  }
  return found;
}
