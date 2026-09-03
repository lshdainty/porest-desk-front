import { i18n } from "@/shared/i18n/config";
import { formatMonthDay, weekdayShort } from "@/shared/lib/date";

/** 현재 로케일이 영어인지. 순수 함수라 React 밖에서도 i18n.language 직접 참조. */
export const isEn = (): boolean => (i18n.language ?? "").startsWith("en");

/**
 * 손으로 붙이는 금액 부호는 U+2212(−) 하나로 통일한다.
 *
 * 하이픈(-)과 폭이 달라 한 카드 안에서 섞이면 tabular-nums 정렬이 어긋난다
 * (QA #22 — 홈 9월 카드에서 지출은 `−7,560`, 잔액은 `-7,560` 이었다).
 * 앱도 같은 규범이다 — `porest-desk-app/lib/core/format/krw.dart` 주석 참조.
 */
export const MINUS = "−";

/**
 * **크기만** 들고 있는 값(총 부채·지출처럼 절대값으로 오는 값) 앞에 붙일 부호.
 * `−{KRW(v)}` 처럼 마이너스를 문자로 박아 두던 자리를 이걸로 바꾼다.
 *
 * - `0` → 부호 없음. 빈 계정에서 `−0원` 으로 보이던 걸 `0원` 으로(QA #1).
 * - 음수 → `+`. 총 부채는 선결제한 카드 때문에 음수가 될 수 있는데(QA #21 이후
 *   서버가 유형 기준으로 세면 `totalDebt < 0`), 그대로 두면 `−-356,800` 이 된다.
 *
 * 값은 반드시 `KRW(Math.abs(v))` 와 같이 절대값으로 넘겨라.
 */
export const minusOf = (n: number): string =>
  n > 0 ? MINUS : n < 0 ? "+" : "";

export const KRW = (
  n: number,
  { sign = false, abs = false }: { sign?: boolean; abs?: boolean } = {},
): string => {
  const v = abs ? Math.abs(n) : n;
  const s = v.toLocaleString("ko-KR");
  if (sign && n > 0) return `+${s}`;
  return s;
};

/**
 * 통화 표기 — ko `10,000원`(기존 `${KRW(n)}원`과 100% 동일) / en `₩10,000`.
 * KRW 숫자부(부호·abs 포함)를 재사용하고, en 은 선행 부호 뒤에 ₩ 삽입(`-₩10,000`).
 * ko 회귀0: ko 분기는 `${KRW(n, opts)}원` 그대로.
 */
export const money = (
  n: number,
  opts: { sign?: boolean; abs?: boolean } = {},
): string => {
  const s = KRW(n, opts);
  if (!isEn()) return `${s}원`;
  const m = /^([+-]?)(.*)$/.exec(s);
  return m ? `${m[1]}₩${m[2]}` : `₩${s}`;
};

/**
 * 차트 Y축 라벨 — ko 조/억/만 축약 / en `Intl.NumberFormat(compact)`(120M·52K).
 * 음수도 부호 prepend. App `core/format/krw.dart` formatChartAxis 와 정합.
 *
 * 구간마다 정밀도를 달리한다. 한 자리로 뭉개면 축 눈금이 겹치고(84만짜리 차트에서
 * 25·50·75·100만이 "0만, 0만, 100만, 100만" 으로 나왔다), 반대로 늘 만 단위로 쓰면
 * 조 단위에서 "10000.0억" 같은 라벨이 나와 축 폭을 넘는다.
 *
 *   1조~     1.2조        10억~    12억, 9,999억
 *   1억~     5.2억        10만~    25만, 9,999만
 *   1만~     1.2만, 9.9만  ~1만     5000
 */
export const formatChartAxis = (v: number): string => {
  const n = Math.abs(v);
  if (isEn()) {
    // en 은 Intl 로케일 부호(ASCII)를 그대로 — 앱 NumberFormat.compact(en) 과 같은 글자.
    return `${v < 0 ? "-" : ""}${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
  }
  const sign = v < 0 ? MINUS : "";
  if (n >= 1_000_000_000_000)
    return `${sign}${(n / 1_000_000_000_000).toFixed(1)}조`;
  // 10억이 넘으면 소수 한 자리가 읽는 데 보태는 게 없다.
  if (n >= 1_000_000_000)
    return `${sign}${Math.round(n / 100_000_000).toLocaleString("ko-KR")}억`;
  if (n >= 100_000_000) return `${sign}${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) {
    // 1만~10만을 만 단위로 뭉개면 정보가 너무 많이 날아간다 — 11,881 이 "1만"(−16%)이
    // 됐다(QA #38). 이 구간만 소수 한 자리. 10만 위는 소수가 축 폭만 먹고 읽는 데
    // 보태는 게 없어 그대로 정수 만.
    // 반올림해서 10.0 이 되는 값(99,999)은 "10.0만" 대신 정수 "10만" 으로 넘긴다 —
    // 100,000 이 "10만" 이라 바로 옆 두 눈금이 다른 모양으로 찍히지 않게.
    const man = n / 10_000;
    const rounded = Math.round(man * 10) / 10;
    return rounded < 10
      ? `${sign}${rounded.toFixed(1)}만`
      : `${sign}${Math.round(man).toLocaleString("ko-KR")}만`;
  }
  return `${sign}${n.toLocaleString("ko-KR")}`;
};

/**
 * 차트 값/틱 라벨 — 만 단위 축약. ko `457,400 → "46만"`·`120,000,000 → "1.2억"`,
 * en 은 `formatChartAxis`(Intl compact, 457.4K). 음수 부호 prepend.
 * App stats_screen `_fmtTick` 로직 미러.
 *
 * 예전엔 `formatChartAxis` 가 100만 단위로 뭉개서 소액이 "0만" 이 되는 바람에 이 함수가
 * 따로 필요했다. 그 반올림을 걷어낸 뒤로는 ko 결과가 같았는데, QA #38 로
 * `formatChartAxis` 만 1만~10만에서 소수 한 자리를 쓰게 되면서 **다시 갈렸다** —
 * 여기(통계 추이 차트 축)는 그대로 정수 만이다. 두 함수를 같게 만들려면 위 구간
 * 분기를 그대로 옮겨야 하고, 앱 `stats_screen.dart _fmtTick` 도 함께 맞춰야 한다.
 */
export const formatChartAmount = (v: number): string => {
  if (isEn()) return formatChartAxis(v);
  const sign = v < 0 ? MINUS : "";
  const n = Math.abs(v);
  if (n >= 100_000_000) return `${sign}${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000)
    return `${sign}${Math.round(n / 10_000).toLocaleString("ko-KR")}만`;
  return `${sign}${n.toLocaleString("ko-KR")}`;
};

export const formatDay = (dStr: string) => {
  const parts = dStr.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(y, m - 1, d);
  return { md: formatMonthDay(dt), dow: weekdayShort(dt), dt };
};

/**
 * Returns ISO_LOCAL_DATE_TIME string "YYYY-MM-DDTHH:mm:ss" based on local time.
 * Safe to send to a Java LocalDateTime endpoint (no timezone suffix).
 */
export const toLocalIso = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
