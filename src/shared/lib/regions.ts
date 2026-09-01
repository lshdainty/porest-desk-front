/**
 * 표시 기준 지역 목록. 값은 IANA 타임존 ID 를 그대로 쓴다 (sso-front 의 가입 지역과 동일 목록).
 *
 * 400여 개 IANA 존을 전부 노출하면 고르기 어려워 실제 사용이 있을 법한 지역만 추린다.
 */
export const REGION_OPTIONS = [
  { value: "Asia/Seoul", ko: "대한민국 (서울)", en: "South Korea (Seoul)" },
  { value: "Asia/Tokyo", ko: "일본 (도쿄)", en: "Japan (Tokyo)" },
  { value: "Asia/Shanghai", ko: "중국 (상하이)", en: "China (Shanghai)" },
  { value: "Asia/Hong_Kong", ko: "홍콩", en: "Hong Kong" },
  { value: "Asia/Singapore", ko: "싱가포르", en: "Singapore" },
  { value: "Asia/Bangkok", ko: "태국 (방콕)", en: "Thailand (Bangkok)" },
  { value: "Asia/Kolkata", ko: "인도 (콜카타)", en: "India (Kolkata)" },
  { value: "Asia/Dubai", ko: "아랍에미리트 (두바이)", en: "UAE (Dubai)" },
  { value: "Australia/Sydney", ko: "호주 (시드니)", en: "Australia (Sydney)" },
  { value: "Europe/London", ko: "영국 (런던)", en: "United Kingdom (London)" },
  { value: "Europe/Paris", ko: "프랑스 (파리)", en: "France (Paris)" },
  { value: "Europe/Berlin", ko: "독일 (베를린)", en: "Germany (Berlin)" },
  {
    value: "America/New_York",
    ko: "미국 동부 (뉴욕)",
    en: "US Eastern (New York)",
  },
  {
    value: "America/Chicago",
    ko: "미국 중부 (시카고)",
    en: "US Central (Chicago)",
  },
  {
    value: "America/Denver",
    ko: "미국 산악 (덴버)",
    en: "US Mountain (Denver)",
  },
  {
    value: "America/Los_Angeles",
    ko: "미국 서부 (로스앤젤레스)",
    en: "US Pacific (Los Angeles)",
  },
  {
    value: "America/Sao_Paulo",
    ko: "브라질 (상파울루)",
    en: "Brazil (Sao Paulo)",
  },
  {
    value: "UTC",
    ko: "UTC (협정 세계시)",
    en: "UTC (Coordinated Universal Time)",
  },
] as const;

/** 목록에 없는 값(가입 이후 목록이 바뀌었거나 직접 넣은 값)도 고를 수 있게 옵션으로 끼워준다. */
export const regionOptionsWith = (current: string | undefined) => {
  const base = REGION_OPTIONS as readonly {
    value: string;
    ko: string;
    en: string;
  }[];
  if (!current || base.some((o) => o.value === current)) return base;
  return [{ value: current, ko: current, en: current }, ...base];
};
