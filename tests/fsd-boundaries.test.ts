import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

/**
 * 계층 게이트가 **살아 있는지** 검사한다.
 *
 * 규칙이 통과하는 것과 규칙이 일하는 것은 다르다. 실제로 겪었다 — `import/resolver`
 * 를 안 걸어 둔 동안 `boundaries` 는 모든 임포트를 외부 패키지로 보고 위반 6 건을
 * 심어 놔도 초록불을 냈다. 리졸버는 네이티브 바인딩(`unrs-resolver`)에 얹혀 있어
 * 설치 환경이 바뀌면 또 조용히 죽을 수 있다.
 *
 * 그래서 위반이 **잡히는지**를 CI 에서 매번 확인한다. 게이트가 죽으면 여기가 먼저 빨개진다.
 */
const eslint = new ESLint({
  overrideConfigFile: "eslint.fsd.config.js",
  allowInlineConfig: false,
});

async function layerErrors(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages
    .filter((m) => m.ruleId === "boundaries/dependencies")
    .map((m) => m.message);
}

describe("FSD 계층 게이트", () => {
  it("역방향(shared → entities)을 잡는다", async () => {
    const errors = await layerErrors(
      "src/shared/lib/__probe__.ts",
      'import "@/entities/expense";\n',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("shared");
    expect(errors[0]).toContain("entities");
  });

  it("역방향(features → widgets)을 잡는다", async () => {
    const errors = await layerErrors(
      "src/features/expense/__probe__.ts",
      'import "@/widgets/add-tx";\n',
    );
    expect(errors).toHaveLength(1);
  });

  it("상대경로로 우회해도 잡는다", async () => {
    const errors = await layerErrors(
      "src/entities/expense/__probe__.ts",
      'import "../../features/expense";\n',
    );
    expect(errors).toHaveLength(1);
  });

  it("하향(widgets → features → entities → shared)은 통과시킨다", async () => {
    const errors = await layerErrors(
      "src/widgets/layout/__probe__.ts",
      'import "@/features/expense";\nimport "@/entities/expense";\nimport "@/shared/lib";\n',
    );
    expect(errors).toEqual([]);
  });
});
