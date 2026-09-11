import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 구독 화면의 문구는 **실제 게이트가 막는 것**만 말한다(QA #161).
 *
 * 비교표가 '월 100건'·'CSV 가져오기/내보내기'·'다중 캘린더 공유'·'카드 혜택 추천' 을
 * Free ✗ / Pro ✓ 로 광고하고 있었는데, 코드에는 그런 제한이 하나도 없다 — 플랜
 * features 는 `["SECURITIES"]` 하나뿐이고 서버·웹 게이트는 증권에만 걸린다.
 * 표를 고치면서 문구도 걷었는데, **CSV 에 키를 남겨 두면 다음 사람이 또 쓴다** —
 * 그래서 여기서 잠근다.
 *
 * 번역 원본은 CSV 하나다(`src/locales/**` 는 생성물). 그래서 여기만 본다.
 */
const CSV = "i18n/translations.csv";
const DIALOG = "src/features/subscription/ui/SubscriptionDialog.tsx";

/** 게이트가 없어서 걷어낸 키들. 되살아나면 표가 다시 없는 제한을 판다. */
const REMOVED = [
  "feature.txLog",
  "feature.txFree",
  "feature.txUnlimited",
  "feature.importExport",
  "feature.multiCalendar",
  "feature.cardBenefit",
];

const csv = () => readFileSync(CSV, "utf-8").split("\n");

/** `subscription` 네임스페이스의 `feature.*` 키 목록. */
function featureKeys(): string[] {
  return csv()
    .filter((l) => l.startsWith("subscription,feature."))
    .map((l) => l.split(",")[1]);
}

describe("구독 문구는 실제 게이트만 말한다", () => {
  it("게이트 없는 기능의 키는 CSV 에 없다 — 한국어·영문 모두", () => {
    const offenders = csv()
      .map((line, i) => ({ line, no: i + 1 }))
      .filter(({ line }) =>
        REMOVED.some((k) => line.startsWith(`subscription,${k},`)),
      )
      .map(({ line, no }) => `${CSV}:${no}  ${line.slice(0, 90)}`);

    expect(offenders).toEqual([]);
  });

  it("Pro 가 실제로 주는 증권 줄은 남아 있다", () => {
    expect(featureKeys()).toContain("feature.securities");
  });

  it("비교표가 안 쓰는 `feature.*` 키가 CSV 에 남지 않는다", () => {
    const used = readFileSync(DIALOG, "utf-8");
    const orphans = featureKeys().filter((k) => !used.includes(`"${k}"`));

    expect(orphans).toEqual([]);
  });

  it("Free 배너는 증권 말고 다른 걸 잠갔다고 말하지 않는다", () => {
    const line = csv().find((l) => l.startsWith("subscription,freeLocked,"))!;

    // 가져오기/내보내기·캘린더 공유·카드 혜택은 Free 에서도 전부 된다.
    expect(line).not.toMatch(/가져오기|내보내기|import|export/i);
  });
});
