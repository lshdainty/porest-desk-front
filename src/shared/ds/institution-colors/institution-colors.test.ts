// 기관 색 표 찾기 — groo-design specs/components/institution-colors.yaml(JSON 사본) 그대로인지와 찾는 순서.
import { describe, expect, it } from "vitest";

import spec from "@/shared/ds/spec/institution-colors.json";

import { INSTITUTION_COLORS, institutionColor } from "./institution-colors";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe("기관 색 표", () => {
  it("스펙 JSON 의 78곳을 그대로 읽는다(표가 둘이 아니다)", () => {
    expect(INSTITUTION_COLORS).toHaveLength(78);
    expect(INSTITUTION_COLORS.map((e) => e.name)).toEqual(
      spec.data.entries.map((e) => e.name),
    );
  });

  it("글자색이 78곳 모두 4.5:1 이상이다 — white 는 #fff, dark 는 다크 짙은 글자 #242938 로 잰다", () => {
    for (const entry of INSTITUTION_COLORS) {
      const text = entry.text === "white" ? "#ffffff" : "#242938";
      expect(contrast(entry.color, text), entry.name).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});

describe("institutionColor", () => {
  it("공백을 빼고 같은 이름 · 별칭이면 그 기관이다", () => {
    expect(institutionColor("신한")?.color).toBe("#0046FF");
    expect(institutionColor("신한은행")?.name).toBe("신한");
    expect(institutionColor(" KB 국민 ")?.name).toBe("KB국민");
  });

  it("아니면 이름에 든 가장 긴 이름 — 거꾸로 맞추지 않는다", () => {
    expect(institutionColor("NH농협카드 올원")?.name).toBe("NH농협카드");
    expect(institutionColor("IBK기업은행")?.name).toBe("IBK기업");
    // 표의 "NH농협" 이 찾는 이름 "NH" 를 품는 거꾸로 맞추기는 하지 않는다
    expect(institutionColor("NH")).toBeNull();
  });

  it("같은 회사는 한 색 — 하나 · NH농협은 자산 표 값", () => {
    expect(institutionColor("하나")?.color).toBe("#008485");
    expect(institutionColor("하나카드")?.color).toBe("#008485");
    expect(institutionColor("NH농협")?.color).toBe("#00A651");
  });

  it("없거나 비면 null", () => {
    expect(institutionColor("어떤은행")).toBeNull();
    expect(institutionColor("")).toBeNull();
    expect(institutionColor(null)).toBeNull();
    expect(institutionColor(undefined)).toBeNull();
  });
});
