// 한국 은행/증권사 목록(이름 · 묶음 · 코드 · 별칭). AssetAddDialog 등에서 institution 선택에 쓴다.
// 기관의 색 · 글자색은 이 파일에 두지 않는다 — 기관 색 표 하나(ds institution-colors, groo-design institution-colors.yaml)가 원본이다.
// 표가 둘이면 같은 회사가 다른 색이 되고 흰 글자 대비가 4.5:1 에 못 미치는 곳이 생긴다(03E-010).
import { institutionColor } from "@/shared/ds/institution-colors";

export interface BrandColor {
  bg: string;
  fg?: string; // 짙은 글자가 필요한 밝은 배경일 때만 지정. 기본은 #fff.
}

/** 기관 색 표의 dark 글자색 — 라이트 fg-neutral(#1A1F2E) · 다크 fg-neutral-inverted(#242938), 면이 모드를 따르지 않으므로 짙은 글자 하나 */
export const INSTITUTION_INK = "#1A1F2E";

/** 기관 색 표의 한 줄 → 면 색 · 글자색(white 면 fg 생략 = 흰색) */
export function brandOfInstitution(
  name: string | null | undefined,
): BrandColor | null {
  const hit = institutionColor(name);
  if (!hit) return null;
  return hit.text === "dark"
    ? { bg: hit.color, fg: INSTITUTION_INK }
    : { bg: hit.color };
}

export type BankCategory =
  | "시중은행"
  | "인터넷은행"
  | "지방은행"
  | "특수은행"
  | "저축기관"
  | "외국계"
  | "기타"
  | "증권사"
  | "상품거래소"
  | "가상자산";

/** 투자 상품 등록 시 선택 가능한 카테고리.
 *  증권사: 금투협 표준 코드. 주식·ETF.
 *  상품거래소: 실물 금 — 금은방 체인과 KRX 금시장. 단위가 g 이라 주식과 입력이 다르다.
 *  가상자산: 금융정보분석원(FIU) VASP 신고번호 체계로 별도 관리. */
export const INVEST_CATEGORIES: BankCategory[] = [
  "증권사",
  "상품거래소",
  "가상자산",
];

/** 기관이 정해 주는 보유 유형 — 증권사에서 코인을, 거래소에서 주식을 담을 일은 없다. */
export const CATEGORY_HOLDING_TYPE: Partial<
  Record<BankCategory, "STOCK" | "GOLD" | "CRYPTO">
> = {
  증권사: "STOCK",
  상품거래소: "GOLD",
  가상자산: "CRYPTO",
};

export interface BankEntry {
  name: string;
  category: BankCategory;
  /** 면 색 · 글자색 — 기관 색 표에서 이름(없으면 별칭)으로 찾는다 */
  color: BrandColor;
  /** 은행: 한국은행 표준 금융기관 코드(3자리), 증권사: 금투협 표준 코드(2~3자리),
   *  가상자산: FIU VASP 신고번호(제YYYY-NNN호 형식). */
  code?: string;
  /** 검색/매칭 시 병합할 대체 키(약칭, 옛 이름 등). */
  aliases?: string[];
}

// 국내 은행/증권사 정리 — 브랜드 색상은 공개 CI 가이드·언론 자료 기준(근사치 포함),
// code 는 한국은행 표준 금융기관 코드(은행 3자리) / 금투협 증권사 코드(2~3자리) 기준
const BANK_LIST: Omit<BankEntry, "color">[] = [
  // 시중은행
  {
    name: "신한",
    category: "시중은행",
    code: "088",
    aliases: ["신한은행"],
  },
  {
    name: "KB국민",
    category: "시중은행",
    code: "004",
    aliases: ["KB", "국민", "KB국민은행"],
  },
  {
    name: "우리",
    category: "시중은행",
    code: "020",
    aliases: ["우리은행"],
  },
  {
    name: "하나",
    category: "시중은행",
    code: "081",
    aliases: ["KEB하나", "하나은행"],
  },
  {
    name: "NH농협",
    category: "시중은행",
    code: "011",
    aliases: ["농협", "NH농협은행"],
  },
  {
    name: "IBK기업",
    category: "시중은행",
    code: "003",
    aliases: ["기업", "IBK", "기업은행"],
  },
  {
    name: "SC제일",
    category: "시중은행",
    code: "023",
    aliases: ["제일", "SC", "SC제일은행"],
  },
  {
    name: "씨티",
    category: "시중은행",
    code: "027",
    aliases: ["시티", "씨티은행", "한국씨티"],
  },

  // 인터넷은행
  {
    name: "카카오뱅크",
    category: "인터넷은행",
    code: "090",
    aliases: ["카뱅"],
  },
  {
    name: "토스뱅크",
    category: "인터넷은행",
    code: "092",
    aliases: ["토스"],
  },
  {
    name: "케이뱅크",
    category: "인터넷은행",
    code: "089",
    aliases: ["K뱅크", "K Bank"],
  },

  // 지방은행
  {
    name: "부산",
    category: "지방은행",
    code: "032",
    aliases: ["부산은행", "BNK부산"],
  },
  {
    name: "대구",
    category: "지방은행",
    code: "031",
    aliases: ["대구은행", "iM뱅크", "DGB대구"],
  },
  {
    name: "경남",
    category: "지방은행",
    code: "039",
    aliases: ["경남은행", "BNK경남"],
  },
  {
    name: "광주",
    category: "지방은행",
    code: "034",
    aliases: ["광주은행", "JB광주"],
  },
  {
    name: "전북",
    category: "지방은행",
    code: "037",
    aliases: ["전북은행", "JB전북"],
  },
  {
    name: "제주",
    category: "지방은행",
    code: "035",
    aliases: ["제주은행"],
  },

  // 특수은행 / 정책금융
  {
    name: "KDB산업",
    category: "특수은행",
    code: "002",
    aliases: ["산업", "산업은행", "KDB"],
  },
  {
    name: "수출입",
    category: "특수은행",
    code: "008",
    aliases: ["수출입은행", "EXIM"],
  },
  {
    name: "수협",
    category: "특수은행",
    code: "007",
    aliases: ["수협은행", "Sh수협"],
  },

  // 저축기관 / 상호금융
  {
    name: "우체국",
    category: "저축기관",
    code: "071",
    aliases: ["우체국예금", "우체국금융"],
  },
  {
    name: "새마을금고",
    category: "저축기관",
    code: "045",
    aliases: ["새마을", "MG"],
  },
  {
    name: "신협",
    category: "저축기관",
    code: "048",
    aliases: ["신용협동조합"],
  },
  {
    name: "산림조합",
    category: "저축기관",
    code: "064",
    aliases: ["산림조합중앙회"],
  },
  {
    name: "SBI저축",
    category: "저축기관",
    code: "103",
    aliases: ["SBI저축은행", "SBI"],
  },
  {
    name: "OK저축",
    category: "저축기관",
    aliases: ["OK저축은행"],
  },
  {
    name: "웰컴저축",
    category: "저축기관",
    aliases: ["웰컴저축은행"],
  },
  {
    name: "페퍼저축",
    category: "저축기관",
    aliases: ["페퍼저축은행", "Pepper"],
  },

  // 외국계 (국내 지점)
  {
    name: "HSBC",
    category: "외국계",
    aliases: ["홍콩상하이", "에이치에스비씨"],
  },
  {
    name: "ICBC",
    category: "외국계",
    aliases: ["공상은행", "중국공상은행"],
  },
  {
    name: "BoA",
    category: "외국계",
    aliases: ["뱅크오브아메리카", "Bank of America"],
  },
  {
    name: "도이치",
    category: "외국계",
    aliases: ["도이치뱅크", "Deutsche"],
  },
  {
    name: "JP모건",
    category: "외국계",
    aliases: ["JPMorgan", "JP모건체이스"],
  },

  // 기타 (현금 등 공식 기관 코드가 없는 개인 자산 유형)
  {
    name: "현금",
    category: "기타",
    aliases: ["지갑", "Cash"],
  },

  // 증권사 (금투협 표준 코드)
  {
    name: "삼성증권",
    category: "증권사",
    code: "240",
    aliases: ["삼성"],
  },
  {
    name: "미래에셋",
    category: "증권사",
    code: "230",
    aliases: ["미래에셋증권"],
  },
  {
    name: "NH투자",
    category: "증권사",
    code: "247",
    aliases: ["NH투자증권"],
  },
  {
    name: "한국투자",
    category: "증권사",
    code: "243",
    aliases: ["한투", "한국투자증권"],
  },
  {
    name: "KB증권",
    category: "증권사",
    code: "218",
  },
  {
    name: "신한투자",
    category: "증권사",
    code: "278",
    aliases: ["신한금융투자", "신한투자증권"],
  },
  {
    name: "하나증권",
    category: "증권사",
    code: "270",
  },
  {
    name: "키움증권",
    category: "증권사",
    code: "264",
    aliases: ["키움"],
  },
  {
    name: "메리츠증권",
    category: "증권사",
    code: "287",
    aliases: ["메리츠", "메리츠종합금융증권"],
  },
  {
    name: "대신증권",
    category: "증권사",
    code: "267",
    aliases: ["대신"],
  },
  {
    name: "유안타증권",
    category: "증권사",
    code: "209",
    aliases: ["유안타", "동양"],
  },
  {
    name: "유진투자",
    category: "증권사",
    code: "280",
    aliases: ["유진투자증권"],
  },
  {
    name: "교보증권",
    category: "증권사",
    code: "200",
    aliases: ["교보"],
  },
  {
    name: "IBK투자",
    category: "증권사",
    code: "225",
    aliases: ["IBK투자증권"],
  },
  {
    name: "DB금융투자",
    category: "증권사",
    code: "279",
    aliases: ["DB", "DB금투"],
  },
  {
    name: "SK증권",
    category: "증권사",
    code: "266",
    aliases: ["SK"],
  },
  {
    name: "현대차증권",
    category: "증권사",
    code: "263",
    aliases: ["현대차", "HMC투자"],
  },
  {
    name: "하이투자",
    category: "증권사",
    code: "262",
    aliases: ["하이투자증권"],
  },
  {
    name: "한화투자",
    category: "증권사",
    code: "269",
    aliases: ["한화투자증권", "한화"],
  },
  {
    name: "BNK투자",
    category: "증권사",
    code: "223",
    aliases: ["BNK투자증권"],
  },
  {
    name: "한양증권",
    category: "증권사",
    code: "220",
    aliases: ["한양"],
  },
  {
    name: "LS증권",
    category: "증권사",
    code: "265",
    aliases: ["이베스트", "이베스트투자", "E-best"],
  },
  {
    name: "부국증권",
    category: "증권사",
    code: "290",
    aliases: ["부국"],
  },
  {
    name: "신영증권",
    category: "증권사",
    code: "291",
    aliases: ["신영"],
  },
  {
    name: "카카오페이증권",
    category: "증권사",
    code: "288",
    aliases: ["카카오페이"],
  },
  {
    name: "토스증권",
    category: "증권사",
    code: "298",
  },

  // 상품거래소 (실물 금). 금은방 체인은 표준 기관코드 체계가 없어 code 생략.
  // KRX 금시장은 증권사 HTS 로 거래하지만, 담기는 건 g 단위 실물 금이라 여기에 둔다.
  {
    name: "KRX 금시장",
    category: "상품거래소",
    aliases: ["한국거래소", "KRX", "금시장"],
  },
  {
    name: "한국금거래소",
    category: "상품거래소",
    aliases: ["koreagoldx", "금거래소"],
  },
  {
    name: "한국표준금거래소",
    category: "상품거래소",
    aliases: ["표준금거래소"],
  },
  {
    name: "삼성금거래소",
    category: "상품거래소",
    aliases: ["삼성금"],
  },
  {
    name: "한국조폐공사",
    category: "상품거래소",
    aliases: ["조폐공사", "오롯", "KOMSCO"],
  },
  {
    name: "기타 금은방",
    category: "상품거래소",
    aliases: ["금은방", "직접보관", "실물"],
  },

  // 가상자산거래소 (KR 원화마켓 주요 거래소).
  // 금융정보분석원(FIU) VASP 신고사업자. code 는 공식 신고번호 형식(제YYYY-NNN호)이 통일돼 있지 않아 생략.
  {
    name: "업비트",
    category: "가상자산",
    aliases: ["Upbit", "UPBIT", "두나무"],
  },
  {
    name: "빗썸",
    category: "가상자산",
    aliases: ["Bithumb", "BITHUMB"],
  },
  {
    name: "코인원",
    category: "가상자산",
    aliases: ["Coinone", "COINONE"],
  },
  {
    name: "코빗",
    category: "가상자산",
    aliases: ["Korbit", "KORBIT"],
  },
];

/** 기관 색 표에 없는 이름의 면 — 중립색(표에 없는 기관을 목록에 넣으면 시험이 알린다) */
const UNKNOWN_BRAND: BrandColor = { bg: "var(--color-chart-gray)" };

export const BANK_ENTRIES: BankEntry[] = BANK_LIST.map((entry) => ({
  ...entry,
  color:
    [entry.name, ...(entry.aliases ?? [])]
      .map((name) => brandOfInstitution(name))
      .find((brand) => brand !== null) ?? UNKNOWN_BRAND,
}));

/** 기관 이름에서 브랜드 색을 찾는다 — 기관 색 표(institutionColor)로. 후보 가운데 먼저 맞는 것 */
export function getBrandColor(
  ...candidates: (string | null | undefined)[]
): BrandColor | null {
  for (const candidate of candidates) {
    const brand = brandOfInstitution(candidate);
    if (brand) return brand;
  }
  return null;
}

/** 카테고리별로 묶인 은행·증권 리스트. 선택 UI에서 섹션 헤더로 쓰기 편하게 정렬. */
export const BANK_ENTRIES_BY_CATEGORY: Record<BankCategory, BankEntry[]> =
  BANK_ENTRIES.reduce(
    (acc, e) => {
      (acc[e.category] ??= []).push(e);
      return acc;
    },
    {} as Record<BankCategory, BankEntry[]>,
  );

export const BANK_CATEGORY_ORDER: BankCategory[] = [
  "시중은행",
  "인터넷은행",
  "지방은행",
  "특수은행",
  "저축기관",
  "외국계",
  "기타",
  "증권사",
  "상품거래소",
  "가상자산",
];
