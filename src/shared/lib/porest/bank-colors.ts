// 한국 은행/증권사 브랜드 색. AssetAddDialog 등에서 institution 선택·로고 색 매칭에 사용.

export interface BrandColor {
  bg: string
  fg?: string // 노랑 등 밝은 배경일 때만 지정. 기본은 #fff.
}

export type BankCategory = '시중은행' | '인터넷은행' | '지방은행' | '특수은행' | '저축기관' | '외국계' | '증권사'

export interface BankEntry {
  name: string
  category: BankCategory
  color: BrandColor
  /** 한국은행 표준 금융기관 코드(은행 3자리) 또는 금투협 증권사 코드(2~3자리). */
  code?: string
  /** 검색/매칭 시 병합할 대체 키(약칭, 옛 이름 등). */
  aliases?: string[]
}

// 국내 은행/증권사 정리 — 브랜드 색상은 공개 CI 가이드·언론 자료 기준(근사치 포함),
// code 는 한국은행 표준 금융기관 코드(은행 3자리) / 금투협 증권사 코드(2~3자리) 기준
export const BANK_ENTRIES: BankEntry[] = [
  // 시중은행
  { name: '신한',    category: '시중은행', code: '088', color: { bg: '#0046FF' }, aliases: ['신한은행'] },
  { name: 'KB국민',  category: '시중은행', code: '004', color: { bg: '#FFBC00', fg: '#191919' }, aliases: ['KB', '국민', 'KB국민은행'] },
  { name: '우리',    category: '시중은행', code: '020', color: { bg: '#0067AC' }, aliases: ['우리은행'] },
  { name: '하나',    category: '시중은행', code: '081', color: { bg: '#008485' }, aliases: ['KEB하나', '하나은행'] },
  { name: 'NH농협',  category: '시중은행', code: '011', color: { bg: '#00A651' }, aliases: ['농협', 'NH농협은행'] },
  { name: 'IBK기업', category: '시중은행', code: '003', color: { bg: '#004098' }, aliases: ['기업', 'IBK', '기업은행'] },
  { name: 'SC제일',  category: '시중은행', code: '023', color: { bg: '#009A44' }, aliases: ['제일', 'SC', 'SC제일은행'] },
  { name: '씨티',    category: '시중은행', code: '027', color: { bg: '#056DAE' }, aliases: ['시티', '씨티은행', '한국씨티'] },

  // 인터넷은행
  { name: '카카오뱅크',  category: '인터넷은행', code: '090', color: { bg: '#FEE500', fg: '#191919' }, aliases: ['카뱅'] },
  { name: '토스뱅크',    category: '인터넷은행', code: '092', color: { bg: '#0064FF' }, aliases: ['토스'] },
  { name: '케이뱅크',    category: '인터넷은행', code: '089', color: { bg: '#FF6F20' }, aliases: ['K뱅크', 'K Bank'] },

  // 지방은행
  { name: '부산',    category: '지방은행', code: '032', color: { bg: '#0033A0' }, aliases: ['부산은행', 'BNK부산'] },
  { name: '대구',    category: '지방은행', code: '031', color: { bg: '#1464AC' }, aliases: ['대구은행', 'iM뱅크', 'DGB대구'] },
  { name: '경남',    category: '지방은행', code: '039', color: { bg: '#0E4C92' }, aliases: ['경남은행', 'BNK경남'] },
  { name: '광주',    category: '지방은행', code: '034', color: { bg: '#00428A' }, aliases: ['광주은행', 'JB광주'] },
  { name: '전북',    category: '지방은행', code: '037', color: { bg: '#0F3E8C' }, aliases: ['전북은행', 'JB전북'] },
  { name: '제주',    category: '지방은행', code: '035', color: { bg: '#F47216' }, aliases: ['제주은행'] },

  // 특수은행 / 정책금융
  { name: 'KDB산업', category: '특수은행', code: '002', color: { bg: '#004098' }, aliases: ['산업', '산업은행', 'KDB'] },
  { name: '수출입',  category: '특수은행', code: '008', color: { bg: '#003A6C' }, aliases: ['수출입은행', 'EXIM'] },
  { name: '수협',    category: '특수은행', code: '007', color: { bg: '#003DA5' }, aliases: ['수협은행', 'Sh수협'] },

  // 저축기관 / 상호금융
  { name: '우체국',        category: '저축기관', code: '071', color: { bg: '#E4002B' }, aliases: ['우체국예금', '우체국금융'] },
  { name: '새마을금고',    category: '저축기관', code: '045', color: { bg: '#D61E29' }, aliases: ['새마을', 'MG'] },
  { name: '신협',          category: '저축기관', code: '048', color: { bg: '#003A70' }, aliases: ['신용협동조합'] },
  { name: '산림조합',      category: '저축기관', code: '064', color: { bg: '#2E7D32' }, aliases: ['산림조합중앙회'] },
  { name: 'SBI저축',       category: '저축기관', code: '103', color: { bg: '#0E3E85' }, aliases: ['SBI저축은행', 'SBI'] },
  { name: 'OK저축',        category: '저축기관', color: { bg: '#FECC00', fg: '#191919' }, aliases: ['OK저축은행'] },
  { name: '웰컴저축',      category: '저축기관', color: { bg: '#E30613' }, aliases: ['웰컴저축은행'] },
  { name: '페퍼저축',      category: '저축기관', color: { bg: '#B3002D' }, aliases: ['페퍼저축은행', 'Pepper'] },

  // 외국계 (국내 지점)
  { name: 'HSBC',          category: '외국계', color: { bg: '#DB0011' }, aliases: ['홍콩상하이', '에이치에스비씨'] },
  { name: 'ICBC',          category: '외국계', color: { bg: '#D6001C' }, aliases: ['공상은행', '중국공상은행'] },
  { name: 'BoA',           category: '외국계', color: { bg: '#012169' }, aliases: ['뱅크오브아메리카', 'Bank of America'] },
  { name: '도이치',        category: '외국계', color: { bg: '#004A8F' }, aliases: ['도이치뱅크', 'Deutsche'] },
  { name: 'JP모건',        category: '외국계', color: { bg: '#006CB7' }, aliases: ['JPMorgan', 'JP모건체이스'] },

  // 증권사 (금투협 표준 코드)
  { name: '삼성증권',      category: '증권사', code: '240', color: { bg: '#1428A0' }, aliases: ['삼성'] },
  { name: '미래에셋',      category: '증권사', code: '230', color: { bg: '#2C3E50' }, aliases: ['미래에셋증권'] },
  { name: 'NH투자',        category: '증권사', code: '247', color: { bg: '#00A651' }, aliases: ['NH투자증권'] },
  { name: '한국투자',      category: '증권사', code: '243', color: { bg: '#00529B' }, aliases: ['한투', '한국투자증권'] },
  { name: 'KB증권',        category: '증권사', code: '218', color: { bg: '#FFBC00', fg: '#191919' } },
  { name: '신한투자',      category: '증권사', code: '278', color: { bg: '#0046FF' }, aliases: ['신한금융투자', '신한투자증권'] },
  { name: '하나증권',      category: '증권사', code: '270', color: { bg: '#008485' } },
  { name: '키움증권',      category: '증권사', code: '264', color: { bg: '#FF0033' }, aliases: ['키움'] },
  { name: '메리츠증권',    category: '증권사', code: '287', color: { bg: '#E60012' }, aliases: ['메리츠', '메리츠종합금융증권'] },
  { name: '대신증권',      category: '증권사', code: '267', color: { bg: '#F58220' }, aliases: ['대신'] },
  { name: '유안타증권',    category: '증권사', code: '209', color: { bg: '#10B981' }, aliases: ['유안타', '동양'] },
  { name: '유진투자',      category: '증권사', code: '280', color: { bg: '#003595' }, aliases: ['유진투자증권'] },
  { name: '교보증권',      category: '증권사', code: '200', color: { bg: '#004A8F' }, aliases: ['교보'] },
  { name: 'IBK투자',       category: '증권사', code: '225', color: { bg: '#004098' }, aliases: ['IBK투자증권'] },
  { name: 'DB금융투자',    category: '증권사', code: '279', color: { bg: '#008456' }, aliases: ['DB', 'DB금투'] },
  { name: 'SK증권',        category: '증권사', code: '266', color: { bg: '#EA002C' }, aliases: ['SK'] },
  { name: '현대차증권',    category: '증권사', code: '263', color: { bg: '#002C5F' }, aliases: ['현대차', 'HMC투자'] },
  { name: '하이투자',      category: '증권사', code: '262', color: { bg: '#004098' }, aliases: ['하이투자증권'] },
  { name: '한화투자',      category: '증권사', code: '269', color: { bg: '#FF7900' }, aliases: ['한화투자증권', '한화'] },
  { name: 'BNK투자',       category: '증권사', code: '223', color: { bg: '#0033A0' }, aliases: ['BNK투자증권'] },
  { name: '한양증권',      category: '증권사', code: '220', color: { bg: '#004098' }, aliases: ['한양'] },
  { name: 'LS증권',        category: '증권사', code: '265', color: { bg: '#005EB8' }, aliases: ['이베스트', '이베스트투자', 'E-best'] },
  { name: '부국증권',      category: '증권사', code: '290', color: { bg: '#003366' }, aliases: ['부국'] },
  { name: '신영증권',      category: '증권사', code: '291', color: { bg: '#005EB8' }, aliases: ['신영'] },
  { name: '카카오페이증권', category: '증권사', code: '288', color: { bg: '#FEE500', fg: '#191919' }, aliases: ['카카오페이'] },
  { name: '토스증권',      category: '증권사', code: '298', color: { bg: '#0064FF' } },
]

// 빠른 조회용 맵
const BRAND_MAP: Record<string, BrandColor> = {}
for (const e of BANK_ENTRIES) {
  BRAND_MAP[e.name] = e.color
  for (const a of e.aliases ?? []) BRAND_MAP[a] = e.color
}

function normalize(s: string): string {
  return s.replace(/\s+/g, '').trim()
}

/** 은행/증권사 이름에서 브랜드 색을 찾는다. 정확 매칭 → 포함 매칭(가장 긴 키 우선). */
export function getBrandColor(...candidates: (string | null | undefined)[]): BrandColor | null {
  const keys = Object.keys(BRAND_MAP).sort((a, b) => b.length - a.length)
  for (const c of candidates) {
    if (!c) continue
    const n = normalize(c)
    const exact = BRAND_MAP[n]
    if (exact) return exact
    for (const k of keys) {
      const hit = BRAND_MAP[k]
      if (hit && n.includes(k)) return hit
    }
  }
  return null
}

/** 카테고리별로 묶인 은행·증권 리스트. 선택 UI에서 섹션 헤더로 쓰기 편하게 정렬. */
export const BANK_ENTRIES_BY_CATEGORY: Record<BankCategory, BankEntry[]> = BANK_ENTRIES.reduce(
  (acc, e) => {
    ;(acc[e.category] ??= []).push(e)
    return acc
  },
  {} as Record<BankCategory, BankEntry[]>,
)

export const BANK_CATEGORY_ORDER: BankCategory[] = [
  '시중은행',
  '인터넷은행',
  '지방은행',
  '특수은행',
  '저축기관',
  '외국계',
  '증권사',
]
