import boundaries from "eslint-plugin-boundaries";
import tseslint from "typescript-eslint";

/**
 * FSD 계층 규칙 — 이 파일이 단 하나의 정의다.
 *
 * `eslint.config.js`(에디터·`npm run lint`)와 `eslint.fsd.config.js`(CI 게이트)가
 * 둘 다 여기서 가져간다. 두 벌로 갈라 두면 한쪽만 고쳐 놓고 통과했다고 믿게 된다.
 *
 * 규칙은 하나뿐이다 — **위를 부르지 않는다.**
 *
 *     app → pages → widgets → features → entities → shared
 *
 * 백엔드는 순환 참조가 나면 빌드가 안 된다. 프론트는 번들러가 알아서 엮어 주므로
 * 조용히 쌓인다. 실제로 11 건까지 갔다가 되돌렸다 — 그래서 규칙을 건다.
 *
 * 같은 계층끼리(features → 다른 features)는 지금 막지 않는다. 30 건이 남아 있어
 * 켜는 순간 CI 가 빨개진다. 방향부터 잠그고, 교차는 줄여 가며 따로 켠다.
 */
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];

/** 자기 계층과 그 아래 전부를 허용한다. */
const allowedFrom = (layer) => LAYERS.slice(LAYERS.indexOf(layer));

export const fsdConfig = [
  {
    files: ["src/**/*.{ts,tsx}"],
    // 게이트가 단독으로 돌 때도 TS/TSX 를 읽어야 한다 — 파서가 없으면 419 개
    // 파일이 전부 "Parsing error" 로 죽고, 그건 계층 위반 0 과 구분되지 않는다.
    languageOptions: { parser: tseslint.parser },
    plugins: { boundaries },
    settings: {
      // **이 줄이 없으면 규칙이 조용히 아무것도 안 잡는다.** 기본 node 리졸버는
      // `.ts`/`.tsx` 확장자도, tsconfig 의 `@/` 별칭도 못 푼다. 못 푼 임포트는
      // 외부 패키지로 분류돼 검사 대상에서 빠지고, CI 는 초록불이 된다.
      // 실제로 위반 5 건을 심어 놓고 통과하는 걸 확인한 뒤에 찾았다.
      "import/resolver": { typescript: { project: "tsconfig.app.json" } },
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "pages", pattern: "src/pages" },
        { type: "widgets", pattern: "src/widgets" },
        { type: "features", pattern: "src/features" },
        { type: "entities", pattern: "src/entities" },
        { type: "shared", pattern: "src/shared" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "FSD 위반: {{from.type}} 는 {{to.type}} 를 부를 수 없다 " +
            "(app → pages → widgets → features → entities → shared, 아래로만).",
          policies: LAYERS.map((layer) => ({
            from: [{ element: { type: layer } }],
            allow: allowedFrom(layer).map((t) => ({
              to: { element: { type: t } },
            })),
          })),
        },
      ],
    },
  },
];
